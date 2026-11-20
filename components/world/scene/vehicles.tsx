'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { WORLD, riverParallel, riverSamples, rng, type XZ } from '@/lib/world/geo'
import { BRIDGES, coastalRoad, riverRoadX } from '@/lib/world/layout'
import { palette } from '@/lib/world/palette'
import { DECK_TOP } from './bridges'
import { DRAGON_DECK_TOP } from './dragon-bridge'

/* ------------------------------------------------------------------------ */
/* Paths                                                                     */
/* ------------------------------------------------------------------------ */

/** Shift a polyline sideways by `d` (positive = right of travel). */
function offsetLine(line: XZ[], d: number): XZ[] {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)]
    const b = line[Math.min(line.length - 1, i + 1)]
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const len = Math.hypot(dx, dz) || 1
    return [p[0] - (dz / len) * d, p[1] + (dx / len) * d] as const
  })
}

/** Road surface height: deck tops on the bridges, the street everywhere else. */
function roadY(x: number, z: number) {
  const onSpan = (bz: number, top: number) =>
    Math.abs(z - bz) < 1.4 && x > riverRoadX('west', bz) - 0.2 && x < riverRoadX('east', bz) + 0.2
      ? top
      : null
  return (
    onSpan(BRIDGES.dragon, DRAGON_DECK_TOP) ??
    onSpan(BRIDGES.hanRiver, DECK_TOP) ??
    onSpan(BRIDGES.tranThiLy, DECK_TOP) ??
    0.04
  )
}

function loop(points: XZ[]) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'centripetal',
    0.1,
  )
}

/** Out along one lane, back along the other. */
function outAndBack(line: XZ[], lane: number) {
  return loop([...offsetLine(line, lane), ...offsetLine([...line].reverse(), lane)])
}

/** Riverfront circuit: north on the west bank, over the Han River Bridge, south, back over Tran Thi Ly. */
function riverCircuit(lane: number, reverse: boolean) {
  const west = riverParallel(1.75, 0, 1).filter(([, z]) => z < BRIDGES.tranThiLy && z > BRIDGES.hanRiver)
  const east = riverParallel(-1.75, 0, 1)
    .filter(([, z]) => z < BRIDGES.tranThiLy && z > BRIDGES.hanRiver)
    .reverse()
  const pts: XZ[] = [...west, ...east]
  const ordered = reverse ? [...pts].reverse() : pts
  return loop(offsetLine(ordered, lane))
}

interface Mover {
  curve: THREE.CatmullRomCurve3
  speed: number
  u: number
  color: string
}

/* ------------------------------------------------------------------------ */
/* Cars                                                                      */
/* ------------------------------------------------------------------------ */

export function Cars() {
  const movers = useMemo<Mover[]>(() => {
    const r = rng(42)
    const dragonAxis: XZ[] = [
      [-36, 0],
      [riverRoadX('west', 0), 0],
      [riverRoadX('east', 0), 0],
      [20.2, 0],
    ]
    const routes = [
      { curve: riverCircuit(0.32, false), cars: 5 },
      { curve: riverCircuit(-0.32, true), cars: 4 },
      { curve: outAndBack(dragonAxis, 0.42), cars: 6 },
      { curve: outAndBack(coastalRoad.filter(([, z]) => z < 26), 0.32), cars: 4 },
    ]
    return routes.flatMap(({ curve, cars }) => {
      const len = curve.getLength()
      return Array.from({ length: cars }, (_, i) => ({
        curve,
        speed: (2.1 + r() * 0.8) / len,
        u: i / cars + r() * 0.05,
        color: palette.cars[Math.floor(r() * palette.cars.length)],
      }))
    })
  }, [])

  const bodies = useRef<THREE.InstancedMesh>(null)
  const cabins = useRef<THREE.InstancedMesh>(null)
  const bodyGeometry = useMemo(() => new THREE.BoxGeometry(0.62, 0.2, 0.32).translate(0, 0.14, 0), [])
  const cabinGeometry = useMemo(() => new THREE.BoxGeometry(0.34, 0.16, 0.28).translate(-0.04, 0.32, 0), [])
  const d = useMemo(() => new THREE.Object3D(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])
  const colored = useRef(false)

  useFrame((_, delta) => {
    const b = bodies.current
    const c = cabins.current
    if (!b || !c) return
    const dt = Math.min(delta, 0.1)
    movers.forEach((m, i) => {
      m.u = (m.u + m.speed * dt) % 1
      m.curve.getPointAt(m.u, p)
      m.curve.getTangentAt(m.u, t)
      d.position.set(p.x, roadY(p.x, p.z), p.z)
      d.rotation.set(0, Math.atan2(-t.z, t.x), 0)
      d.updateMatrix()
      b.setMatrixAt(i, d.matrix)
      c.setMatrixAt(i, d.matrix)
      if (!colored.current) {
        b.setColorAt(i, new THREE.Color(m.color))
        c.setColorAt(i, new THREE.Color(palette.warmWhite))
      }
    })
    if (!colored.current) {
      colored.current = true
      if (b.instanceColor) b.instanceColor.needsUpdate = true
      if (c.instanceColor) c.instanceColor.needsUpdate = true
    }
    b.instanceMatrix.needsUpdate = true
    c.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodies} args={[bodyGeometry, undefined, movers.length]} castShadow frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={cabins} args={[cabinGeometry, undefined, movers.length]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Boats                                                                     */
/* ------------------------------------------------------------------------ */

function circle(cx: number, cz: number, rx: number, rz: number): XZ[] {
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2
    return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz] as const
  })
}

export function Boats() {
  const boats = useMemo(() => {
    const center = riverSamples()
      .filter((s) => s.t > 0.08 && s.t < 0.98)
      .map((s) => [s.x, s.z] as const)
    return [
      { curve: outAndBack(center, 1.1), speed: 0.012, u: 0.1, hull: '#FFF8EB', size: 0.85 },
      { curve: outAndBack(center, 1.1), speed: 0.012, u: 0.6, hull: '#F28C7B', size: 0.75 },
      { curve: loop(circle(-12, -38, 7, 4)), speed: 0.018, u: 0, hull: '#7FB7D9', size: 1 },
      { curve: loop(circle(6, -42, 5, 3)), speed: -0.022, u: 0.4, hull: '#F5C76B', size: 0.9 },
      { curve: loop(circle(40, 8, 4, 9)), speed: 0.014, u: 0.2, hull: '#FFF8EB', size: 1.1 },
      { curve: loop(circle(46, -10, 3, 5)), speed: -0.02, u: 0.7, hull: '#9ED0B4', size: 0.9 },
    ]
  }, [])

  const refs = useRef<(THREE.Group | null)[]>([])
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime
    const dt = Math.min(delta, 0.1)
    boats.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      b.u = (((b.u + b.speed * dt) % 1) + 1) % 1
      b.curve.getPointAt(b.u, p)
      b.curve.getTangentAt(b.u, t)
      const dir = Math.sign(b.speed) || 1
      g.position.set(p.x, WORLD.waterY + 0.02 + Math.sin(time * 1.8 + i) * 0.03, p.z)
      g.rotation.set(Math.sin(time * 1.3 + i) * 0.05, Math.atan2(-t.z * dir, t.x * dir), Math.cos(time * 1.1 + i) * 0.05)
    })
  })

  return (
    <group>
      {boats.map((b, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} scale={b.size}>
          <Boat hull={b.hull} />
        </group>
      ))}
    </group>
  )
}

const hullGeometry = (() => {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0.12)
  s.lineTo(0.55, 0.16)
  s.quadraticCurveTo(0.42, -0.05, 0.25, -0.1)
  s.lineTo(-0.42, -0.1)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: false })
  g.translate(0, 0, -0.18)
  return g
})()

function Boat({ hull }: { hull: string }) {
  return (
    <group>
      <mesh geometry={hullGeometry} castShadow>
        <meshLambertMaterial color={hull} flatShading />
      </mesh>
      <mesh position={[-0.1, 0.25, 0]} castShadow>
        <boxGeometry args={[0.32, 0.18, 0.26]} />
        <meshLambertMaterial color={palette.warmWhite} />
      </mesh>
      <mesh position={[-0.12, 0.36, 0]}>
        <boxGeometry args={[0.38, 0.04, 0.3]} />
        <meshLambertMaterial color={palette.pagodaRed} />
      </mesh>
      <mesh position={[0.18, 0.4, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
        <meshLambertMaterial color={palette.woodDark} />
      </mesh>
    </group>
  )
}
