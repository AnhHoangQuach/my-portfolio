'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { WORLD } from '@/lib/world/geo'
import { riverRoadX } from '@/lib/world/layout'
import { daylight } from '@/lib/world/daylight'
import { glowColor } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { useWorld } from '@/lib/world/store'
import { HoverOutline, Landmark } from '../landmark'
import { studioEnvironment } from './environment'
import { StaticInstances, type PropTransform } from './instanced'

export const DRAGON_DECK_TOP = 0.32

/** Span of the Dragon Bridge deck along X, at z = 0. */
export function dragonSpan() {
  return { x0: riverRoadX('west', 0) - 0.4, x1: riverRoadX('east', 0) + 0.4 }
}

/**
 * The dragon's spine: a golden body undulating over the deck in arches, tail
 * curling up at the west end, head raised at the east end facing the sea.
 */
function buildDragonCurve(x0: number, x1: number) {
  const y0 = DRAGON_DECK_TOP + 0.12
  const bodyStart = x0 + 0.5
  const bodyEnd = x1 - 1.9
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(x0 - 0.35, y0 + 1.7, 0),
    new THREE.Vector3(x0 - 0.15, y0 + 0.9, 0),
    new THREE.Vector3(bodyStart - 0.1, y0 + 0.15, 0),
  ]
  const humps = 4
  const steps = 48
  for (let i = 1; i <= steps; i++) {
    const u = i / steps
    const x = THREE.MathUtils.lerp(bodyStart, bodyEnd, u)
    const s = Math.abs(Math.sin(Math.PI * humps * u))
    pts.push(new THREE.Vector3(x, y0 + 0.1 + 2.05 * Math.pow(s, 0.85), 0))
  }
  pts.push(new THREE.Vector3(x1 - 1.2, y0 + 1.1, 0))
  pts.push(new THREE.Vector3(x1 - 0.55, y0 + 2.1, 0))
  pts.push(new THREE.Vector3(x1 - 0.1, y0 + 2.55, 0))
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal')
}

/** Dragon Bridge (Cau Rong) — HOME. */
export function DragonBridge() {
  return (
    <Landmark id="dragon-bridge">
      <DragonBridgeModel />
    </Landmark>
  )
}

function DragonBridgeModel() {
  const { x0, x1 } = useMemo(() => dragonSpan(), [])
  const curve = useMemo(() => buildDragonCurve(x0, x1), [x0, x1])
  const length = x1 - x0 + 1.2
  const cx = (x0 + x1) / 2

  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.gold,
        // Reflects the studio environment map like real gilded metal.
        metalness: 0.72,
        roughness: 0.3,
        emissive: palette.goldGlow,
        emissiveIntensity: 0.14,
        flatShading: true,
      }),
    [],
  )

  // Glow up on hover and while breathing fire; damped, no React re-renders.
  // The shared gold material is reached through the body mesh: three.js
  // objects are mutated via refs in the frame loop, never via memoised values.
  const bodyMesh = useRef<THREE.Mesh>(null)
  const fireUntil = useRef(0)
  const lastFire = useRef(useWorld.getState().fireNonce)
  useFrame(({ clock }, delta) => {
    const material = bodyMesh.current?.material as THREE.MeshStandardMaterial | undefined
    if (!material) return
    const s = useWorld.getState()
    // Pick up the studio reflections once they've been rendered.
    if (!material.envMap && studioEnvironment.environment) {
      material.envMap = studioEnvironment.environment
      material.envMapIntensity = 0.9
      material.needsUpdate = true
    }
    if (s.fireNonce !== lastFire.current) {
      lastFire.current = s.fireNonce
      fireUntil.current = clock.elapsedTime + 3.2
    }
    const firing = clock.elapsedTime < fireUntil.current
    // Floodlit gold after dark, like the real bridge.
    const base = 0.14 + 0.5 * daylight.night.value
    const goal = firing ? 0.75 : s.hoveredId === 'dragon-bridge' ? Math.max(0.55, base) : base
    material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, goal, 5, delta)
  })

  const body = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.2, 7, false), [curve])
  const head = useMemo(() => curve.getPoint(1), [curve])
  const tail = useMemo(() => curve.getPoint(0), [curve])

  return (
    <group>
      {/* Deck, kerbs and the road surface */}
      <mesh position={[cx, DRAGON_DECK_TOP - 0.13, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.26, 2.7]} />
        <meshLambertMaterial color={palette.stone} />
      </mesh>
      <mesh position={[cx, DRAGON_DECK_TOP + 0.005, 0]} receiveShadow>
        <boxGeometry args={[length, 0.01, 2.3]} />
        <meshLambertMaterial color={palette.road} />
      </mesh>
      {[-1.3, 1.3].map((z) => (
        <mesh key={z} position={[cx, DRAGON_DECK_TOP + 0.09, z]} castShadow>
          <boxGeometry args={[length, 0.16, 0.08]} />
          <meshLambertMaterial color={palette.warmWhite} />
        </mesh>
      ))}

      {/* Piers */}
      {[0.22, 0.5, 0.78].map((u) => (
        <mesh
          key={u}
          position={[THREE.MathUtils.lerp(x0, x1, u), (DRAGON_DECK_TOP + WORLD.seabedY) / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.5, DRAGON_DECK_TOP - WORLD.seabedY, 2.2]} />
          <meshLambertMaterial color={palette.stone} />
        </mesh>
      ))}

      {/* The dragon */}
      <mesh ref={bodyMesh} geometry={body} material={gold} castShadow>
        <HoverOutline id="dragon-bridge" thickness={0.05} />
      </mesh>
      <Spines curve={curve} material={gold} />
      <DragonHead position={head} material={gold} />
      <mesh position={tail} rotation={[0, 0, 0.5]} material={gold} castShadow>
        <coneGeometry args={[0.2, 0.7, 7]} />
      </mesh>

      <BodyLights curve={curve} />
      <StreetLamps x0={x0} x1={x1} />
    </group>
  )
}

function Spines({ curve, material }: { curve: THREE.Curve<THREE.Vector3>; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = 46
  const geometry = useMemo(() => new THREE.ConeGeometry(0.09, 0.32, 4).translate(0, 0.16, 0), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const u = 0.06 + (i / (count - 1)) * 0.86
      const p = curve.getPointAt(u)
      const t = curve.getTangentAt(u)
      d.position.copy(p).addScaledVector(new THREE.Vector3(-t.y, t.x, 0), 0.17)
      d.rotation.set(0, 0, Math.atan2(t.y, t.x))
      d.scale.setScalar(0.8 + 0.4 * Math.sin(u * Math.PI))
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [curve])

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow />
}

function DragonHead({ position, material }: { position: THREE.Vector3; material: THREE.Material }) {
  const eye = useMemo(
    () => new THREE.MeshBasicMaterial({ color: glowColor('#FF7A3D') }),
    [],
  )
  return (
    <group position={position} rotation={[0, 0, -0.18]}>
      {/* Skull and snout */}
      <mesh position={[0.18, 0.02, 0]} material={material} castShadow>
        <boxGeometry args={[0.62, 0.44, 0.48]} />
      </mesh>
      <mesh position={[0.6, -0.04, 0]} material={material} castShadow>
        <boxGeometry args={[0.5, 0.26, 0.36]} />
      </mesh>
      {/* Open lower jaw */}
      <mesh position={[0.5, -0.27, 0]} rotation={[0, 0, -0.32]} material={material} castShadow>
        <boxGeometry args={[0.55, 0.1, 0.32]} />
      </mesh>
      {/* Horns, swept back */}
      {[-0.14, 0.14].map((z) => (
        <mesh key={z} position={[-0.2, 0.38, z]} rotation={[z * 1.4, 0, 0.95]} material={material}>
          <coneGeometry args={[0.06, 0.6, 5]} />
        </mesh>
      ))}
      {/* Mane */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[-0.18 - i * 0.2, 0.12 - i * 0.12, 0]}
          rotation={[0, 0, 1.2 + i * 0.15]}
          material={material}
        >
          <coneGeometry args={[0.1, 0.5, 4]} />
        </mesh>
      ))}
      {/* Eyes */}
      {[-0.245, 0.245].map((z) => (
        <mesh key={z} position={[0.32, 0.12, z]} material={eye}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** Fairy lights strung along the dragon, gently chasing toward the head. */
function BodyLights({ curve }: { curve: THREE.Curve<THREE.Vector3> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = 60
  const colors = useMemo(() => [glowColor('#FFE6A3'), glowColor('#FFB34D')], [])
  const geometry = useMemo(() => new THREE.SphereGeometry(0.045, 6, 4), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const u = 0.04 + (i / (count - 1)) * 0.92
      const p = curve.getPointAt(u)
      d.position.set(p.x, p.y - 0.05, i % 2 ? 0.21 : -0.21)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
      mesh.setColorAt(i, colors[0])
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [curve, colors])

  const tmp = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const k = 0.5 + 0.5 * Math.sin(i * 0.5 - t * 3)
      tmp.copy(colors[0]).lerp(colors[1], k)
      mesh.setColorAt(i, tmp)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshBasicMaterial />
    </instancedMesh>
  )
}

function StreetLamps({ x0, x1 }: { x0: number; x1: number }) {
  const { posts, bulbs, postGeometry, bulbGeometry, postMaterial, bulbMaterial } = useMemo(() => {
    const n = 7
    const posts: PropTransform[] = []
    const bulbs: PropTransform[] = []
    for (let i = 0; i < n; i++) {
      const x = THREE.MathUtils.lerp(x0 + 0.6, x1 - 0.6, i / (n - 1))
      for (const z of [-1.3, 1.3]) {
        posts.push({ position: [x, DRAGON_DECK_TOP + 0.35, z] })
        bulbs.push({ position: [x, DRAGON_DECK_TOP + 0.74, z] })
      }
    }
    return {
      posts,
      bulbs,
      postGeometry: new THREE.CylinderGeometry(0.025, 0.03, 0.7, 5),
      bulbGeometry: new THREE.SphereGeometry(0.07, 8, 6),
      postMaterial: new THREE.MeshLambertMaterial({ color: palette.woodDark }),
      bulbMaterial: new THREE.MeshBasicMaterial({ color: glowColor(palette.lantern) }),
    }
  }, [x0, x1])
  return (
    <group>
      <StaticInstances geometry={postGeometry} material={postMaterial} items={posts} />
      <StaticInstances geometry={bulbGeometry} material={bulbMaterial} items={bulbs} />
    </group>
  )
}

/** Mouth position in world space — the fire emitter anchors here. */
export function dragonMouth() {
  const { x0, x1 } = dragonSpan()
  const head = buildDragonCurve(x0, x1).getPoint(1)
  return new THREE.Vector3(head.x + 0.85, head.y - 0.2, 0)
}

