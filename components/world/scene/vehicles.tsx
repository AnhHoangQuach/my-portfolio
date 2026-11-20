'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { WORLD, riverSamples, rng, type XZ } from '@/lib/world/geo'
import { BRIDGES, riverRoadX, roads } from '@/lib/world/layout'
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
/* ------------------------------------------------------------------------ */
/* Traffic                                                                   */
/* ------------------------------------------------------------------------ */

/** A closed lane: out along one side of a road, back along the other. */
interface Lane {
  pts: XZ[]
  /** Cumulative length at each point. */
  cum: number[]
  length: number
}

function makeLane(line: XZ[], offset: number): Lane {
  const pts = [...offsetLine(line, offset), ...offsetLine([...line].reverse(), offset)]
  pts.push(pts[0])
  const cum = [0]
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  return { pts, cum, length: cum[cum.length - 1] }
}

interface Vehicle {
  lane: Lane
  /** Starting distance along the lane. */
  start: number
  speed: number
  bike: boolean
  color: string
  rider: string
}

/** Lines traffic drives on: every road plus the three bridge spans. */
function trafficLines(): { line: XZ[]; width: number }[] {
  const lines = roads.filter((rd) => rd.kind === 'road').map((rd) => ({ line: rd.line, width: rd.width }))
  for (const z of Object.values(BRIDGES)) {
    lines.push({ line: [[riverRoadX('west', z), z], [riverRoadX('east', z), z]], width: 1.4 })
  }
  return lines
}

/**
 * City traffic, Da Nang style: mostly motorbikes, plus cars, on every road
 * and across the bridges, in both directions. Two instanced meshes per
 * vehicle type; positions advance along precomputed lane polylines.
 */
export function Cars() {
  const vehicles = useMemo<Vehicle[]>(() => {
    const r = rng(42)
    const out: Vehicle[] = []
    for (const { line, width } of trafficLines()) {
      const carLane = makeLane(line, width * 0.22)
      const bikeLane = makeLane(line, width * 0.36)
      const mid = line[Math.floor(line.length / 2)]
      // Dense in town, thinning out into the countryside.
      const density = Math.max(0.12, 1 - Math.hypot(mid[0], mid[1]) / 160)
      const cars = Math.round((carLane.length / 9) * density)
      const bikes = Math.round((bikeLane.length / 3.2) * density)
      for (let i = 0; i < cars; i++) {
        out.push({
          lane: carLane, start: r() * carLane.length, speed: 2 + r() * 1.2, bike: false,
          color: palette.cars[Math.floor(r() * palette.cars.length)], rider: '#1d1f22',
        })
      }
      for (let i = 0; i < bikes; i++) {
        out.push({
          lane: bikeLane, start: r() * bikeLane.length, speed: 1.5 + r() * 1.1, bike: true,
          color: palette.bikes[Math.floor(r() * palette.bikes.length)],
          rider: ['#e8e2d0', '#3b5f8a', '#c8423a', '#2b2b2b', '#e1b94a', '#6f8f5a'][Math.floor(r() * 6)],
        })
      }
    }
    return out
  }, [])

  const cars = useMemo(() => vehicles.filter((v) => !v.bike), [vehicles])
  const bikes = useMemo(() => vehicles.filter((v) => v.bike), [vehicles])

  const carBody = useRef<THREE.InstancedMesh>(null)
  const carCabin = useRef<THREE.InstancedMesh>(null)
  const bikeBody = useRef<THREE.InstancedMesh>(null)
  const bikeRider = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(
    () => ({
      carBody: new THREE.BoxGeometry(0.5, 0.15, 0.25).translate(0, 0.11, 0),
      carCabin: new THREE.BoxGeometry(0.28, 0.12, 0.21).translate(-0.03, 0.24, 0),
      bikeBody: new THREE.BoxGeometry(0.2, 0.07, 0.055).translate(0, 0.07, 0),
      bikeRider: new THREE.BoxGeometry(0.07, 0.15, 0.07).translate(-0.02, 0.17, 0),
    }),
    [],
  )
  /**
   * Per-frame state lives here, created on the first frame: distance along
   * the lane and a segment-index cache (progress is monotonic, so lookups
   * stay O(1)). The vehicle descriptors themselves are never mutated.
   */
  const sim = useRef<{
    d: THREE.Object3D
    colored: boolean
    cars: { list: Vehicle[]; s: Float32Array; seg: Int32Array }
    bikes: { list: Vehicle[]; s: Float32Array; seg: Int32Array }
  } | null>(null)

  useFrame((_, delta) => {
    const meshes = [carBody.current, carCabin.current, bikeBody.current, bikeRider.current]
    if (meshes.some((m) => !m)) return
    const [cb, cc, bb, br] = meshes as THREE.InstancedMesh[]
    const init = (list: Vehicle[]) => ({
      list,
      s: Float32Array.from(list, (v) => v.start),
      seg: new Int32Array(list.length),
    })
    sim.current ??= { d: new THREE.Object3D(), colored: false, cars: init(cars), bikes: init(bikes) }
    const state = sim.current
    const d = state.d
    const dt = Math.min(delta, 0.1)
    const place = (
      st: { list: Vehicle[]; s: Float32Array; seg: Int32Array },
      body: THREE.InstancedMesh,
      top: THREE.InstancedMesh,
    ) => {
      st.list.forEach((v, i) => {
        const L = v.lane
        const s = (st.s[i] + v.speed * dt) % L.length
        st.s[i] = s
        let seg = st.seg[i]
        if (s < L.cum[seg]) seg = 0
        while (seg < L.pts.length - 2 && L.cum[seg + 1] < s) seg++
        st.seg[i] = seg
        const a = L.pts[seg]
        const b = L.pts[seg + 1]
        const segLen = L.cum[seg + 1] - L.cum[seg] || 1
        const k = (s - L.cum[seg]) / segLen
        const x = a[0] + (b[0] - a[0]) * k
        const z = a[1] + (b[1] - a[1]) * k
        d.position.set(x, roadY(x, z), z)
        d.rotation.set(0, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0)
        d.updateMatrix()
        body.setMatrixAt(i, d.matrix)
        top.setMatrixAt(i, d.matrix)
        if (!state.colored) {
          body.setColorAt(i, new THREE.Color(v.color))
          top.setColorAt(i, new THREE.Color(v.bike ? v.rider : '#1d2227'))
        }
      })
      body.instanceMatrix.needsUpdate = true
      top.instanceMatrix.needsUpdate = true
    }
    place(state.cars, cb, cc)
    place(state.bikes, bb, br)
    if (!state.colored) {
      state.colored = true
      for (const m of [cb, cc, bb, br]) if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={carBody} args={[geo.carBody, undefined, cars.length]} castShadow frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={carCabin} args={[geo.carCabin, undefined, cars.length]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={bikeBody} args={[geo.bikeBody, undefined, bikes.length]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={bikeRider} args={[geo.bikeRider, undefined, bikes.length]} frustumCulled={false}>
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
