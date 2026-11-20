import * as THREE from 'three'

import { EAST_LAND, WEST_LAND, WORLD, type XZ } from './geo'
import { palette } from './palette'

/**
 * Shared materials and shader patches. One time uniform drives every animated
 * shader, advanced by a single `useFrame` in the scene root — no per-object
 * React state, no per-frame re-renders.
 */
export const timeUniform = { value: 0 }

const NOISE_GLSL = /* glsl */ `
  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x),
               mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`

/** Adds a world-position varying to a built-in material's vertex shader. */
function injectWorldPos(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;',
    )
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      #ifdef USE_INSTANCING
        vec4 wPos4 = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        vWNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
      #else
        vec4 wPos4 = modelMatrix * vec4(transformed, 1.0);
        vWNormal = normalize(mat3(modelMatrix) * objectNormal);
      #endif
      vWPos = wPos4.xyz;`,
    )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\n${NOISE_GLSL}`,
  )
}

/* ------------------------------------------------------------------------ */
/* Ground                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Ground: natural grass with tonal variation around the city, turning into a
 * patchwork of rice paddies, crops and bare soil (with field borders) out in
 * the countryside — the way the land around Da Nang reads from the air.
 */
export function createGroundMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: palette.grass })
  m.onBeforeCompile = (shader) => {
    injectWorldPos(shader)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float gN = wNoise(vWPos.xz * 0.09) * 0.55 + wNoise(vWPos.xz * 0.31) * 0.3 + wNoise(vWPos.xz * 1.9) * 0.15;
      vec3 grass = diffuseColor.rgb * (0.78 + gN * 0.36);
      grass = mix(grass, vec3(0.30, 0.29, 0.13), smoothstep(0.66, 0.92, gN) * 0.45);

      float rural = smoothstep(58.0, 92.0, length(vWPos.xz));
      vec2 fp = vWPos.xz * vec2(0.105, 0.07) + vec2(wNoise(vWPos.xz * 0.015) * 3.0, 0.0);
      vec2 cell = floor(fp);
      vec2 f = fract(fp);
      float h = wHash(cell);
      vec3 field = mix(vec3(0.09, 0.20, 0.04), vec3(0.24, 0.30, 0.07), h);
      field = mix(field, vec3(0.20, 0.15, 0.08), step(0.86, h));
      field *= 0.9 + wNoise(vWPos.xz * 0.8) * 0.2;
      float border = 1.0 - step(0.05, f.x) * step(0.05, f.y);
      field = mix(field, vec3(0.16, 0.17, 0.09), border * 0.8);
      vec3 ground = mix(grass, field, rural);

      // Far hills and mountains: forest on the slopes, bare rock where steep or high.
      float hill = smoothstep(0.6, 3.0, vWPos.y);
      vec3 forest = mix(vec3(0.045, 0.085, 0.03), vec3(0.08, 0.13, 0.045), wNoise(vWPos.xz * 0.06));
      ground = mix(ground, forest, hill);
      float rock = (1.0 - smoothstep(0.55, 0.78, vWNormal.y)) * smoothstep(4.0, 12.0, vWPos.y);
      rock = max(rock, smoothstep(48.0, 70.0, vWPos.y));
      ground = mix(ground, vec3(0.20, 0.19, 0.17) * (0.85 + wNoise(vWPos.xz * 0.3) * 0.3), clamp(rock, 0.0, 1.0));
      diffuseColor.rgb = ground;`,
    )
  }
  m.customProgramCacheKey = () => 'world-ground'
  return m
}

/** Direction toward the sun; matches the key light in the scene. */
export const SUN_POSITION = new THREE.Vector3(46, 68, 30)
export const SUN_DIRECTION = SUN_POSITION.clone().normalize()

/* ------------------------------------------------------------------------ */
/* Surface detail                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Fine, world-space surface texture painted in the shader, so the miniature
 * reads like painted resin and real materials up close without image files.
 */
const DETAIL_GLSL = {
  // Rows of tiles on sloped faces; flat roofs stay clean.
  roof: `
    float slope = smoothstep(0.15, 0.3, vWNormal.y) * (1.0 - smoothstep(0.9, 0.97, vWNormal.y));
    float row = smoothstep(0.0, 0.16, fract(vWPos.y * 9.0));
    float tile = wHash(floor(vec2(vWPos.x + vWPos.z, vWPos.y) * vec2(6.0, 9.0)));
    diffuseColor.rgb *= mix(1.0, (0.8 + 0.2 * row) * (0.94 + 0.12 * tile), slope);`,
  // Speckled grain plus wind ripples.
  sand: `
    float grain = wHash(floor(vWPos.xz * 38.0));
    float ripple = sin(vWPos.x * 7.0 + wNoise(vWPos.xz * 0.8) * 5.0) * 0.5 + 0.5;
    diffuseColor.rgb *= 0.93 + grain * 0.1 - ripple * 0.035;`,
  // Horizontal strata and weathering streaks.
  limestone: `
    float n = wNoise(vWPos.xz * 1.6 + vWPos.y * 0.4);
    float strata = sin(vWPos.y * 5.5 + n * 3.0) * 0.5 + 0.5;
    float streak = wNoise(vec2(vWPos.x * 3.0 + vWPos.z * 3.0, vWPos.y * 0.6));
    diffuseColor.rgb *= 0.86 + strata * 0.1 + streak * 0.08;`,
  // Soft plaster mottling on walls.
  plaster: `
    diffuseColor.rgb *= 0.95 + wNoise(vWPos.xy * 2.3 + vWPos.zy * 1.7) * 0.07;`,
} as const

export type SurfaceDetail = keyof typeof DETAIL_GLSL

/** Patches a built-in material in place to add surface detail; returns it. */
export function withSurfaceDetail<T extends THREE.Material>(material: T, kind: SurfaceDetail): T {
  const previous = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer)
    if (!shader.fragmentShader.includes('varying vec3 vWPos;')) injectWorldPos(shader)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>\n${DETAIL_GLSL[kind]}`,
    )
  }
  const key = material.customProgramCacheKey?.() ?? ''
  material.customProgramCacheKey = () => `${key}|detail-${kind}`
  return material
}

/* ------------------------------------------------------------------------ */
/* Light sources                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Colour for things that emit light (lamps, lanterns, fire). Pushed past 1.0
 * so bloom picks them out while sunlit walls stay below the threshold; tone
 * mapping folds the excess back into a bright, saturated glow.
 */
export const GLOW = 3.2
export function glowColor(hex: string, k = GLOW) {
  return new THREE.Color(hex).multiplyScalar(k)
}

/* ------------------------------------------------------------------------ */
/* Buildings                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Realistic facades, all procedural, per building instance:
 * - low and mid-rise: punched windows floor by floor, concrete floor bands,
 *   open shopfronts on the ground floor (Da Nang's tube-house streets);
 * - high-rise: mostly glass curtain walls with mullions and spandrels.
 * Glass reflects the sky with a fresnel term, so towers pick up the sky's
 * colour at grazing angles the way real glazing does.
 */
export function createBuildingMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: '#ffffff' })
  m.onBeforeCompile = (shader) => {
    injectWorldPos(shader)
    shader.uniforms.uWindow = { value: new THREE.Color(palette.window) }
    shader.uniforms.uSkyRefl = { value: new THREE.Color(palette.sky.horizon) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vInst;\nvarying float vHeight;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vInst = instanceMatrix[3].xyz;
          vHeight = length(instanceMatrix[1].xyz);
        #else
          vInst = vec3(0.0);
          vHeight = 6.0;
        #endif`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec3 uWindow;\nuniform vec3 uSkyRefl;\nvarying vec3 vInst;\nvarying float vHeight;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 wn = normalize(vWNormal);
        float side = 1.0 - step(0.5, abs(wn.y));
        float seed = wHash(floor(vInst.xz * 3.1) + 17.0);
        float tower = step(4.2, vHeight) * step(seed, 0.7);
        float u = abs(wn.x) > 0.5 ? vWPos.z : vWPos.x;
        float floorH = 0.3;
        float fy = fract(vWPos.y / floorH);
        float level = floor(vWPos.y / floorH);
        float fx = fract(u * 2.6 + seed * 7.0);

        float punched = step(0.2, fx) * step(fx, 0.8) * step(0.3, fy) * step(fy, 0.8);
        float shop = step(0.08, fx) * step(fx, 0.92) * step(0.05, fy) * step(fy, 0.86);
        punched = mix(punched, shop, step(level, 0.5));
        float curtain = step(0.07, fract(u * 3.4)) * step(0.14, fy);
        float glass = mix(punched, curtain, tower) * side * step(0.02, vWPos.y);

        float band = (1.0 - step(0.1, fy)) * side * (1.0 - tower);
        vec3 glassTint = mix(vec3(0.035, 0.06, 0.08), vec3(0.06, 0.10, 0.12), seed);
        diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - band * 0.18), glassTint, glass);

        vec3 V = normalize(vViewPosition);
        float fres = pow(1.0 - clamp(abs(dot(normal, V)), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += uSkyRefl * glass * (0.05 + 0.55 * fres) * (0.6 + 0.4 * tower);
        float lit = step(0.86, wHash(vec2(level, floor(u * 2.6)) + vInst.xz));
        totalEmissiveRadiance += uWindow * glass * lit * 0.06 * (1.0 - tower);`,
      )
  }
  m.customProgramCacheKey = () => 'world-building'
  return m
}

/* ------------------------------------------------------------------------ */
/* Foliage                                                                   */
/* ------------------------------------------------------------------------ */

/** Lambert foliage that sways in the breeze, phase-offset per instance. */
export function createSwayMaterial(color = '#ffffff', amount = 0.06) {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 swaySeed = instanceMatrix[3].xz;
        #else
          vec2 swaySeed = vec2(0.0);
        #endif
        float sway = sin(uTime * 1.4 + swaySeed.x * 0.7 + swaySeed.y * 0.43) * ${amount.toFixed(3)};
        float sway2 = cos(uTime * 1.1 + swaySeed.y * 0.6) * ${(amount * 0.6).toFixed(3)};
        float k = max(transformed.y, 0.0);
        transformed.x += sway * k;
        transformed.z += sway2 * k;`,
      )
  }
  m.customProgramCacheKey = () => `world-sway-${amount}`
  return m
}

/* ------------------------------------------------------------------------ */
/* Water                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Bakes the land outline into a blurred mask. The water shader reads it to
 * find the shallows and to draw foam along every shore — a cheap stand-in for
 * a depth buffer, built once from the same polygons as the land.
 */
function createShoreTexture() {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const R = WORLD.shoreExtent
  const toPx = ([x, z]: XZ) => [((x + R) / (2 * R)) * size, ((z + R) / (2 * R)) * size] as const
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  // Additive so the two channels don't overwrite each other.
  ctx.globalCompositeOperation = 'lighter'
  const draw = (blur: number, alpha: number, color: string) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = blur
    for (const poly of [WEST_LAND, EAST_LAND]) {
      ctx.beginPath()
      poly.forEach((p, i) => {
        const [px, py] = toPx(p)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }
  // Red: a wide soft halo for the shallows. Green: a tight one for the foam line.
  // (Blur radii are in pixels: ~4.3 px per world unit at this extent.)
  draw(24, 0.6, '#f00')
  draw(9, 0.5, '#f00')
  draw(3.5, 1, '#0f0')
  const tex = new THREE.CanvasTexture(canvas)
  // Canvas row 0 is the world's north edge, and the shader samples it that way.
  tex.flipY = false
  tex.colorSpace = THREE.NoColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

export function createWaterMaterial() {
  const shore = createShoreTexture()
  const material = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uShore: { value: null },
        uExtent: { value: WORLD.shoreExtent },
        uDeep: { value: new THREE.Color(palette.deepSea) },
        uSea: { value: new THREE.Color(palette.turquoise) },
        uShallow: { value: new THREE.Color('#3f948f') },
        uFoam: { value: new THREE.Color(palette.warmWhite) },
        uSky: { value: new THREE.Color(palette.ocean) },
        uSkyTop: { value: new THREE.Color(palette.sky.top) },
        uSkyHorizon: { value: new THREE.Color(palette.sky.horizon) },
        uSunDir: { value: SUN_DIRECTION.clone() },
        uSunColor: { value: new THREE.Color('#FFE3B8').multiplyScalar(2.2) },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime;
      varying vec3 vWPos;
      void main() {
        vec3 p = position;
        vec4 w = modelMatrix * vec4(p, 1.0);
        w.y += sin(w.x * 0.32 + uTime * 0.9) * 0.035 + cos(w.z * 0.27 + uTime * 0.7) * 0.035;
        vWPos = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform sampler2D uShore;
      uniform float uExtent;
      uniform vec3 uDeep;
      uniform vec3 uSea;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uSky;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      varying vec3 vWPos;
      ${NOISE_GLSL}
      void main() {
        float r = length(vWPos.xz);
        vec2 uv = (vWPos.xz + uExtent) / (2.0 * uExtent);
        // Outside the mask the sea is open water: no shallows, no foam.
        float inMask = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        vec4 mask = texture2D(uShore, clamp(uv, 0.0, 1.0)) * inMask;
        float shore = mask.r;
        float edge = mask.g;

        // Open sea darkens toward the rim; shallows glow turquoise.
        vec3 col = mix(uSea, uDeep, smoothstep(30.0, 220.0, r) * (1.0 - shore));
        col = mix(col, uShallow, smoothstep(0.08, 0.55, shore) * 0.8);

        // Sky-tinted glints drifting across the surface.
        float n = wNoise(vWPos.xz * 0.45 + vec2(uTime * 0.12, -uTime * 0.08));
        float n2 = wNoise(vWPos.xz * 1.3 - vec2(uTime * 0.2, uTime * 0.05));
        col = mix(col, uSky, smoothstep(0.55, 0.85, n) * 0.22);
        col += smoothstep(0.86, 0.97, n2 * n) * 0.05;

        // Foam: a thin line hugging every shore, with ripples lapping in.
        float band = sin(edge * 18.0 - uTime * 1.6 + n * 4.0) * 0.5 + 0.5;
        float foam = smoothstep(0.18, 0.4, edge) * smoothstep(0.6, 0.95, band) * 0.7;
        foam += smoothstep(0.42, 0.6, edge);
        col = mix(col, uFoam, clamp(foam, 0.0, 1.0) * 0.55);

        // Ripple normal from the noise gradient, for reflections and glints.
        vec2 rp = vWPos.xz * 0.9 + vec2(uTime * 0.25, uTime * 0.18);
        float e = 0.08;
        float hx = wNoise(rp + vec2(e, 0.0)) - wNoise(rp - vec2(e, 0.0));
        float hz = wNoise(rp + vec2(0.0, e)) - wNoise(rp - vec2(0.0, e));
        vec3 N = normalize(vec3(-hx * 1.6, 1.0, -hz * 1.6));
        vec3 V = normalize(cameraPosition - vWPos);
        // Fresnel: the sky mirrors in more strongly at grazing angles.
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 skyRefl = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 0.6, R.y));
        col = mix(col, skyRefl, clamp(fres, 0.0, 1.0) * 0.55 * (1.0 - shore * 0.5));
        // Sun glints dancing on the ripples.
        float spec = pow(max(dot(R, uSunDir), 0.0), 260.0);
        col += uSunColor * spec * (1.0 - smoothstep(0.3, 0.7, shore));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  })
  // `UniformsUtils.merge` clones; re-point time at the shared uniform.
  material.uniforms.uTime = timeUniform
  material.uniforms.uShore.value = shore
  return material
}

/* ------------------------------------------------------------------------ */
/* Soft sprites                                                              */
/* ------------------------------------------------------------------------ */

let glowTexture: THREE.Texture | null = null

/** Radial white falloff for mist and glow sprites. Generated once, no assets. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}
