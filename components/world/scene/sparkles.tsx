'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

import { rng } from '@/lib/world/geo'
import { timeUniform } from '@/lib/world/materials'

/**
 * Floating motes around a landmark. Replaces drei's <Sparkles>, whose shader
 * computes `0.05 / distanceToCenter` — infinite at the exact centre of a point
 * sprite. On screen that clamps to white, but in the half-float
 * post-processing buffers the Inf survives, bloom spreads it across the frame
 * and tone mapping turns it into NaN: a blank canvas from some camera angles.
 * This version bounds every term, and animates on the GPU from the shared
 * clock, so it costs no per-frame JS.
 */
export function Sparkles({
  position,
  scale,
  count,
  size,
  color,
  opacity = 0.8,
  seed = 1,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  count: number
  size: number
  color: string
  opacity?: number
  seed?: number
}) {
  const geometry = useMemo(() => {
    const r = rng(seed)
    const pos = new Float32Array(count * 3)
    const phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * scale[0]
      pos[i * 3 + 1] = (r() - 0.5) * scale[1]
      pos[i * 3 + 2] = (r() - 0.5) * scale[2]
      phase[i] = r() * Math.PI * 2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [count, scale, seed])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: timeUniform,
          uSize: { value: size },
          uOpacity: { value: opacity },
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader: /* glsl */ `
          attribute float aPhase;
          uniform float uTime;
          uniform float uSize;
          varying float vTwinkle;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.4 + aPhase) * 0.35;
            p.y += sin(uTime * 0.6 + aPhase * 1.3) * 0.45;
            p.z += cos(uTime * 0.35 + aPhase) * 0.35;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            vTwinkle = 0.55 + 0.45 * sin(uTime * 2.0 + aPhase * 3.0);
            // max() keeps the size finite for points at or behind the camera.
            gl_PointSize = uSize * 22.0 / max(-mv.z, 0.5);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            // Bounded glow: no division can blow up at the sprite centre.
            float glow = clamp(0.05 / max(d, 0.04) - 0.1, 0.0, 1.0);
            gl_FragColor = vec4(uColor, glow * uOpacity * vTwinkle);
          }
        `,
      }),
    [size, opacity, color],
  )

  return (
    <points
      position={position}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      raycast={() => null}
    />
  )
}
