'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { rng } from '@/lib/world/geo'
import { useWorld } from '@/lib/world/store'
import { dragonMouth } from './dragon-bridge'

const COUNT = 320
const BURST_SECONDS = 3.2
const LIFE = 0.95

/**
 * The Dragon Bridge breathes fire (it really does, on weekend nights). A
 * fixed pool of point particles is recycled; nothing allocates per frame.
 */
export function DragonFire() {
  const mouth = useMemo(() => dragonMouth(), [])
  const points = useRef<THREE.Points>(null)
  const light = useRef<THREE.PointLight>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    g.setAttribute('aAge', new THREE.BufferAttribute(new Float32Array(COUNT).fill(1), 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(COUNT).map(rng(77)), 1))
    return g
  }, [])

  /** CPU-side particle state, created on the first frame and mutated only there. */
  const sim = useRef<{
    velocity: Float32Array
    age: Float32Array
    random: () => number
    cursor: number
  } | null>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        // Normal blending: additive washes out to white over a bright pastel world.
        blending: THREE.NormalBlending,
        uniforms: { uScale: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aAge;
          attribute float aSeed;
          uniform float uScale;
          varying float vAge;
          void main() {
            vAge = aAge;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float size = mix(0.45, 1.6, smoothstep(0.0, 0.6, aAge)) * (0.7 + aSeed * 0.6);
            gl_PointSize = size * uScale * 260.0 / -mv.z * step(aAge, 0.999);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vAge;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            // smoothstep needs edge0 < edge1; reversed edges are undefined in GLSL.
            float a = (1.0 - smoothstep(0.15, 0.5, d)) * (1.0 - vAge * vAge) * 0.95;
            vec3 hot = vec3(1.0, 0.95, 0.65);
            vec3 mid = vec3(1.0, 0.55, 0.12);
            vec3 cool = vec3(0.85, 0.2, 0.08);
            vec3 col = mix(hot, mid, smoothstep(0.0, 0.35, vAge));
            col = mix(col, cool, smoothstep(0.35, 0.9, vAge));
            // HDR: brighter than white so bloom catches it; tone mapping folds it back.
            gl_FragColor = vec4(col * 3.2, a);
            #include <tonemapping_fragment>
          }
        `,
      }),
    [],
  )

  const burstUntil = useRef(0)
  const lastNonce = useRef(useWorld.getState().fireNonce)

  useFrame(({ clock, gl }, delta) => {
    const p = points.current
    if (!p) return
    sim.current ??= {
      velocity: new Float32Array(COUNT * 3),
      age: new Float32Array(COUNT).fill(LIFE),
      random: rng(1234),
      cursor: 0,
    }
    const { velocity, age, random } = sim.current
    const nonce = useWorld.getState().fireNonce
    const t = clock.elapsedTime
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce
      burstUntil.current = t + BURST_SECONDS
    }
    const firing = t < burstUntil.current
    const dt = Math.min(delta, 0.05)
    const pos = p.geometry.getAttribute('position') as THREE.BufferAttribute
    const ageAttr = p.geometry.getAttribute('aAge') as THREE.BufferAttribute

    if (firing) {
      const spawn = Math.ceil(dt * 260)
      for (let k = 0; k < spawn; k++) {
        const i = sim.current.cursor
        sim.current.cursor = (i + 1) % COUNT
        pos.setXYZ(i, mouth.x, mouth.y, mouth.z)
        velocity[i * 3] = 4.5 + random() * 2.5
        velocity[i * 3 + 1] = 0.3 + random() * 1.4
        velocity[i * 3 + 2] = (random() - 0.5) * 1.6
        age[i] = 0
      }
    }

    let alive = 0
    for (let i = 0; i < COUNT; i++) {
      if (age[i] >= LIFE) continue
      alive++
      age[i] += dt
      velocity[i * 3] *= 0.97
      velocity[i * 3 + 1] += dt * 1.6 // flames rise
      pos.setXYZ(
        i,
        pos.getX(i) + velocity[i * 3] * dt,
        pos.getY(i) + velocity[i * 3 + 1] * dt,
        pos.getZ(i) + velocity[i * 3 + 2] * dt,
      )
      ageAttr.setX(i, Math.min(1, age[i] / LIFE))
    }
    if (alive) {
      pos.needsUpdate = true
      ageAttr.needsUpdate = true
    }
    p.visible = alive > 0
    ;(p.material as THREE.ShaderMaterial).uniforms.uScale.value = gl.getPixelRatio()

    if (light.current) {
      const goal = firing ? 14 + Math.sin(t * 40) * 3 : 0
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, goal, 8, delta)
      light.current.visible = light.current.intensity > 0.05
    }
  })

  return (
    <group>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
      <pointLight
        ref={light}
        position={[mouth.x + 1.5, mouth.y + 0.3, 0]}
        color="#FF8A3D"
        intensity={0}
        distance={14}
        decay={1.6}
      />
    </group>
  )
}

