'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { rng } from '@/lib/world/geo'
import { daylight } from '@/lib/world/daylight'
import { getGlowTexture } from '@/lib/world/materials'
import type { Quality } from '@/lib/world/quality'
import { useWorld } from '@/lib/world/store'

/* ------------------------------------------------------------------------ */
/* Clouds                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Soft cumulus built from camera-facing billboards in one instanced draw.
 * Each billboard is shaded lighter on top, fades out near the camera (so the
 * intro falls *through* the cloud bank) and takes the scene's haze.
 */
function createCloudMaterial(opacity: number) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { uOpacity: { value: opacity }, uNight: daylight.night },
    ]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec2 vUv;
      varying float vDist;
      varying float vSeed;
      void main() {
        #ifdef USE_INSTANCING
          vec3 center = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float scale = length(instanceMatrix[0].xyz);
        #else
          vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float scale = 1.0;
        #endif
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 wp = center + (right * position.x + up * position.y * 0.62) * scale;
        vUv = uv;
        vSeed = fract(center.x * 0.137 + center.z * 0.291);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        vDist = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uOpacity;
      uniform float uNight;
      varying vec2 vUv;
      varying float vDist;
      varying float vSeed;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p * vec2(1.0, 1.15)) * 2.0;
        float body = 1.0 - smoothstep(0.35, 1.0, d);
        float lit = mix(0.88, 1.04, smoothstep(0.15, 0.85, vUv.y));
        vec3 col = vec3(lit) * mix(vec3(0.93, 0.95, 0.98), vec3(1.0, 0.98, 0.95), vSeed);
        col *= mix(vec3(1.0), vec3(0.13, 0.15, 0.22), uNight);
        float alpha = body * uOpacity * smoothstep(6.0, 40.0, vDist);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  })
  // `UniformsUtils.merge` clones, so point uNight back at the shared value.
  material.uniforms.uNight = daylight.night
  return material
}

interface Puff {
  x: number
  y: number
  z: number
  s: number
}

function buildCloudBank(seed: number, clouds: number, rMin: number, rMax: number, y: [number, number], size: [number, number]) {
  const r = rng(seed)
  const puffs: Puff[] = []
  for (let c = 0; c < clouds; c++) {
    const a = r() * Math.PI * 2
    const d = rMin + r() * (rMax - rMin)
    const cx = Math.cos(a) * d
    const cz = Math.sin(a) * d
    const cy = y[0] + r() * (y[1] - y[0])
    const s = size[0] + r() * (size[1] - size[0])
    const n = 6 + Math.floor(r() * 6)
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1) - 0.5
      puffs.push({
        x: cx + t * s * 2.4 + (r() - 0.5) * s * 0.6,
        y: cy + (1 - Math.abs(t) * 1.6) * s * 0.35 + (r() - 0.5) * s * 0.2,
        z: cz + (r() - 0.5) * s * 0.9,
        s: s * (0.7 + (1 - Math.abs(t)) * 0.7 + r() * 0.3),
      })
    }
  }
  return puffs
}

function CloudBank({
  puffs,
  opacity,
  drift,
  visibleIn,
}: {
  puffs: Puff[]
  opacity: number
  drift: number
  visibleIn?: (phase: string) => boolean
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const material = useMemo(() => createCloudMaterial(opacity), [opacity])
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    if (visibleIn) m.visible = visibleIn(useWorld.getState().phase)
    if (!m.visible) return
    const off = clock.elapsedTime * drift
    puffs.forEach((p, i) => {
      dummy.position.set(p.x + off, p.y, p.z)
      dummy.scale.setScalar(p.s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, puffs.length]}
      frustumCulled={false}
      renderOrder={3}
    />
  )
}

const showHigh = (phase: string) => phase === 'loading' || phase === 'intro'

export function Clouds({ quality }: { quality: Quality }) {
  const ambient = useMemo(
    () => buildCloudBank(5, quality === 'high' ? 16 : 9, 90, 380, [42, 70], [9, 16]),
    [quality],
  )
  // The bank the intro camera falls through; hidden once it's below.
  const high = useMemo(() => buildCloudBank(9, 22, 0, 150, [96, 136], [14, 24]), [])
  return (
    <>
      <CloudBank puffs={ambient} opacity={0.8} drift={-0.6} />
      <CloudBank puffs={high} opacity={0.75} drift={-1.2} visibleIn={showHigh} />
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Mist                                                                      */
/* ------------------------------------------------------------------------ */

/** Soft billboards hugging hills and mountains, breathing slowly. */
export function Mist({
  spots,
  color = '#ffffff',
  opacity = 0.32,
}: {
  spots: { x: number; y: number; z: number; s: number }[]
  color?: string
  opacity?: number
}) {
  const group = useRef<THREE.Group>(null)
  const texture = useMemo(() => getGlowTexture(), [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const sprite = child as THREE.Sprite
      const m = sprite.material as THREE.SpriteMaterial
      m.opacity = opacity * (0.7 + 0.3 * Math.sin(t * 0.35 + i * 1.7))
      m.color.setScalar(1 - 0.78 * daylight.night.value)
      sprite.position.x = spots[i].x + Math.sin(t * 0.12 + i) * 0.6
    })
  })

  return (
    <group ref={group}>
      {spots.map((s, i) => (
        <sprite key={i} position={[s.x, s.y, s.z]} scale={[s.s * 2.2, s.s, 1]}>
          <spriteMaterial
            map={texture}
            color={color}
            transparent
            opacity={opacity}
            depthWrite={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
}
