'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { daylight } from '@/lib/world/daylight'
import { car, resetCar, stepCar } from '@/lib/world/drive'
import { useWorld, type RideState } from '@/lib/world/store'
import { PLAYER_CAR } from '@/lib/world/vehicle-kinds'
import { usePack } from './models'
import { roadY } from './vehicles'

/** Lamp positions on the player's model (forward +X), in world units. */
const LAMPS = { front: 0.243, rear: -0.243, side: 0.068, headY: 0.085, tailY: 0.1 }

/**
 * The beams of the headlights on the road ahead: an additive wedge that
 * widens and fades with distance, faded in with the night. Real spot lights
 * would add lights to every material in the city and recompile them all.
 */
function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -8,
    uniforms: { uNight: daylight.night, uColor: { value: new THREE.Color('#ffe2b0') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // u runs away from the car, v across the beam.
        float along = vUv.x;
        float halfWidth = mix(0.22, 0.5, along);
        float across = abs(vUv.y - 0.5) / halfWidth;
        float a = (1.0 - smoothstep(0.6, 1.0, across)) * (1.0 - smoothstep(0.35, 1.0, along));
        a *= smoothstep(0.0, 0.06, along);
        gl_FragColor = vec4(uColor * a * 0.6 * uNight, 1.0);
      }
    `,
  })
}

/**
 * The visitor's car in ride mode: the same glTF model as the traffic, plus
 * lamps that light up after dark. Its frame callback is the ride's physics
 * tick (`stepCar`); it is mounted before the camera rig, so the chase camera
 * always reads this frame's position.
 */
export function PlayerCar() {
  const pack = usePack('vehicles')
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const last = useRef<RideState>('off')

  const m = useMemo(
    () => ({
      head: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d6') }),
      tail: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a1a') }),
      beam: createBeamMaterial(),
    }),
    [],
  )

  useFrame((_, delta) => {
    const g = root.current
    if (!g) return
    const ride = useWorld.getState().ride
    // Every drive starts fresh at the start line.
    if (ride === 'on' && last.current === 'off') resetCar()
    last.current = ride
    g.visible = ride !== 'off'
    if (ride === 'off') return

    const dt = Math.min(delta, 0.05)
    if (ride === 'on') stepCar(dt)
    else car.speed = 0

    // Ramps onto the bridge decks are eased, not stepped.
    const groundY = roadY(car.x, car.z)
    car.y += (groundY - car.y) * (1 - Math.exp(-14 * dt))
    g.position.set(car.x, car.y, car.z)
    g.rotation.y = -car.heading
    // A little body roll into the corners.
    if (body.current) {
      const k = Math.min(1, Math.abs(car.speed) / 2)
      body.current.rotation.x = car.steer * k * 0.06
    }

    // Lamps: dim by day, HDR after dark so bloom picks them up; brake lights
    // flare when stopping.
    const night = daylight.night.value
    const braking = car.speed < 0.2
    m.head.color.set('#fff2d6').multiplyScalar(THREE.MathUtils.lerp(1, 3.2, night))
    m.tail.color.set('#ff2a1a').multiplyScalar(THREE.MathUtils.lerp(braking ? 1.6 : 0.8, braking ? 3 : 2, night))
  })

  const lamp = useMemo(() => new THREE.BoxGeometry(0.012, 0.026, 0.045), [])

  return (
    <group ref={root} visible={false}>
      <group ref={body}>
        {pack && <mesh geometry={pack.geometry[PLAYER_CAR]} material={pack.material[PLAYER_CAR]} castShadow />}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh geometry={lamp} material={m.head} position={[LAMPS.front, LAMPS.headY, side * LAMPS.side]} />
            <mesh geometry={lamp} material={m.tail} position={[LAMPS.rear, LAMPS.tailY, side * LAMPS.side]} />
          </group>
        ))}
      </group>
      {/* Headlight beams on the road, 2 units long; kept level, not rolled. */}
      <mesh material={m.beam} position={[1.25, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 1.5]} />
      </mesh>
    </group>
  )
}
