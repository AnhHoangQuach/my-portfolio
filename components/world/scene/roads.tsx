'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { daylight } from '@/lib/world/daylight'
import { hillHeight, ribbonGeometry, resample, type XZ } from '@/lib/world/geo'
import { blockOnLand, layout, roads } from '@/lib/world/layout'
import { StaticInstances } from './instanced'
import { palette } from '@/lib/world/palette'

/** Son Tra's winding road: from the coastal road, past the pagoda, over the hills. */
export const SON_TRA_ROAD: XZ[] = resample(
  [
    [19.6, -14],
    [18.4, -19],
    [19.2, -23],
    [22.8, -27.6],
    [25.6, -28.6],
    [27.5, -27.4],
    [31, -28.2],
    [33.6, -31],
    [33, -34.6],
    [29.8, -36.4],
    [26.6, -35.2],
    [26.2, -32.4],
    [28.6, -31.6],
  ],
  0.5,
)

/**
 * Asphalt with lane markings drawn from the ribbon's UVs (x = distance along
 * the road, y = 0..1 across): a dashed centre line, solid edge lines, darker
 * wheel tracks and fine aggregate noise. One material for every road.
 */
function createAsphaltMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: palette.asphalt })
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRoadUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRoadUv = uv;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vRoadUv;
        float rHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float across = vRoadUv.y;
        float along = vRoadUv.x;
        diffuseColor.rgb *= 0.9 + rHash(floor(vec2(along, across * 4.0) * 24.0)) * 0.14;
        float tracks = smoothstep(0.12, 0.0, abs(across - 0.27)) + smoothstep(0.12, 0.0, abs(across - 0.73));
        diffuseColor.rgb *= 1.0 - tracks * 0.08;
        float dash = step(0.5, fract(along * 0.85));
        float centre = (1.0 - smoothstep(0.012, 0.026, abs(across - 0.5))) * dash;
        float edges = (1.0 - smoothstep(0.012, 0.024, abs(across - 0.07))) +
                      (1.0 - smoothstep(0.012, 0.024, abs(across - 0.93)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.77, 0.72), clamp(centre + edges, 0.0, 1.0) * 0.85);`,
      )
  }
  m.customProgramCacheKey = () => 'world-asphalt'
  m.polygonOffset = true
  m.polygonOffsetFactor = -2
  return m
}

/** Light posts along the main roads, both sides, plus where their light lands. */
function streetLights() {
  const posts: [number, number, number][] = []
  const pools: [number, number, number][] = []
  for (const r of roads) {
    if (r.kind !== 'road') continue
    const pts = resample(r.line, 3.2)
    pts.forEach(([x, z], i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const len = Math.hypot(dx, dz) || 1
      const off = r.width / 2 + 0.3
      for (const side of [-1, 1]) {
        if (Math.hypot(x, z) > 140) continue
        posts.push([x - (dz / len) * off * side, 0, z + (dx / len) * off * side])
        // The pool falls just inside the kerb, on the carriageway.
        // Just above the block plinths (top 0.06) the disc spills onto, so it
        // never sits *under* a surface; the material's depth bias does the rest.
        const pool = off - 0.55
        pools.push([x - (dz / len) * pool * side, 0.065, z + (dx / len) * pool * side])
      }
    })
  }
  return { posts, pools }
}

/** Lamp heads: plain metal by day, glowing (HDR, so bloom catches it) at night. */
function createLampMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: '#6d7074' })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = daylight.night
    shader.uniforms.uLamp = { value: new THREE.Color('#ffd28a').multiplyScalar(3.4) }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nuniform vec3 uLamp;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uLamp * uNight;',
      )
  }
  m.customProgramCacheKey = () => 'world-lamp'
  return m
}

/**
 * Pools of warm light on the road under each lamp: additive radial discs in
 * one instanced draw, faded in with the night. Hundreds of real lights would
 * be unaffordable; this reads the same from street level up.
 */
function createLightPoolMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    // The discs lie a hair above the road, the sidewalk and the plinths. A
    // slope-only bias (factor) vanishes when looking straight down, and the
    // depth buffer's world-space precision coarsens with distance squared,
    // so zooming out made the pools z-fight and blink on and off. `units`
    // biases by a fixed number of depth steps, which stays correct at any
    // camera distance.
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -8,
    uniforms: { uNight: daylight.night, uColor: { value: new THREE.Color('#ffb860') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.0, 1.0, d));
        gl_FragColor = vec4(uColor * a * a * 0.38 * uNight, 1.0);
      }
    `,
  })
}

/**
 * Roads (asphalt over a concrete sidewalk), riverside promenades, paved block
 * plinths, parks and street lights, merged so the street network costs a
 * handful of draw calls.
 */
export function Roads() {
  const { asphalt, sidewalk, promenade, plinths, parks, mountain, lights, pools } = useMemo(() => {
    const flat = () => 0.03
    const main = roads.filter((r) => r.kind === 'road')
    const road = main.map((r) => ribbonGeometry(r.line, r.width, () => 0.034))
    const walks = main.map((r) => ribbonGeometry(r.line, r.width + 0.7, () => 0.026))
    const walk = roads
      .filter((r) => r.kind === 'promenade')
      .map((r) => ribbonGeometry(r.line, r.width, flat))

    const pads = layout.blocks.filter(blockOnLand).map((b) => {
      const g = new THREE.BoxGeometry(b.x1 - b.x0, 0.06, b.z1 - b.z0)
      g.translate((b.x0 + b.x1) / 2, 0.03, (b.z0 + b.z1) / 2)
      return g.toNonIndexed()
    })
    const greens = layout.parks.map((b) => {
      const g = new THREE.BoxGeometry(b.x1 - b.x0, 0.05, b.z1 - b.z0)
      g.translate((b.x0 + b.x1) / 2, 0.025, (b.z0 + b.z1) / 2)
      return g.toNonIndexed()
    })

    const strip = (g: THREE.BufferGeometry[]) =>
      g.length ? mergeGeometries(g.map((x) => (x.index ? x.toNonIndexed() : x))) : null

    return {
      asphalt: strip(road),
      sidewalk: strip(walks),
      promenade: strip(walk),
      plinths: strip(pads),
      parks: strip(greens),
      mountain: ribbonGeometry(SON_TRA_ROAD, 0.7, (x, z) => hillHeight(x, z) + 0.06),
      ...(() => {
        const { posts, pools } = streetLights()
        return {
          lights: posts.map((position) => ({ position })),
          pools: pools.map((position) => ({
            position,
            rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
            scale: 2.2,
          })),
        }
      })(),
    }
  }, [])

  const asphaltMaterial = useMemo(() => createAsphaltMaterial(), [])
  const poleGeometry = useMemo(() => new THREE.CylinderGeometry(0.018, 0.024, 0.75, 5).translate(0, 0.375, 0), [])
  const lampGeometry = useMemo(() => new THREE.BoxGeometry(0.16, 0.04, 0.06).translate(0, 0.76, 0), [])
  const poleMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: '#6d7074' }), [])
  const lampMaterial = useMemo(() => createLampMaterial(), [])
  const poolMaterial = useMemo(() => createLightPoolMaterial(), [])
  const poolGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  return (
    <group>
      {sidewalk && (
        <mesh geometry={sidewalk} receiveShadow>
          <meshLambertMaterial color={palette.sidewalk} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
      {asphalt && <mesh geometry={asphalt} material={asphaltMaterial} receiveShadow />}
      {promenade && (
        <mesh geometry={promenade} receiveShadow>
          <meshLambertMaterial color={palette.sidewalk} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
      {plinths && (
        <mesh geometry={plinths} receiveShadow>
          <meshLambertMaterial color={palette.sidewalk} />
        </mesh>
      )}
      {parks && (
        <mesh geometry={parks} receiveShadow>
          <meshLambertMaterial color={palette.grassLight} />
        </mesh>
      )}
      <mesh geometry={mountain} material={asphaltMaterial} receiveShadow />
      <StaticInstances geometry={poleGeometry} material={poleMaterial} items={lights} castShadow />
      <StaticInstances geometry={lampGeometry} material={lampMaterial} items={lights} />
      <StaticInstances geometry={poolGeometry} material={poolMaterial} items={pools} />
    </group>
  )
}
