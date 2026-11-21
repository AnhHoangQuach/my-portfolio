'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { daylight } from '@/lib/world/daylight'
import { WORLD, riverSamples, rng, type XZ } from '@/lib/world/geo'
import { BRIDGES, riverRoadX, roads } from '@/lib/world/layout'
import { CAR_MIX, CAR_MODELS, type CarModel } from '@/lib/world/vehicle-kinds'
import { DECK_TOP } from './bridges'
import { DRAGON_DECK_TOP } from './dragon-bridge'
import { usePack } from './models'

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
export function roadY(x: number, z: number) {
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
  /** Which glTF model draws it (`public/models/vehicles.glb`). */
  model: CarModel
}

/** Small light blocks, each [x, y, z, colour, HDR strength], merged with vertex colours. */
function lightsGeometry(parts: [number, number, number, string, number][]) {
  const geoms = parts.map(([x, y, z, hex, k]) => {
    const g = new THREE.BoxGeometry(0.03, 0.035, 0.05).toNonIndexed()
    g.translate(x, y, z)
    const c = new THREE.Color(hex).multiplyScalar(k)
    const colors = new Float32Array(g.getAttribute('position').count * 3)
    for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i)
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  })
  return mergeGeometries(geoms)!
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
 * Scales every road vehicle's speed (world units per second). At 1 the
 * traffic ran at an apparent ~60 km/h through town; 0.5 is a calmer city pace.
 */
const TRAFFIC_SPEED = 0.5

/** One car per this many units of lane in town (thinner in the countryside). */
const CAR_SPACING = 6

/** Full-detail models within this distance of the camera; `_lod1` beyond. */
const LOD_DISTANCE = 40

const zeroCounts = () => Object.fromEntries(CAR_MODELS.map((m) => [m, 0])) as Record<CarModel, number>

/**
 * City traffic: cars, taxis, vans and pickups on every road and across the
 * bridges, in both directions. Every vehicle is a glTF model
 * from `vehicles.glb` — full detail near the camera, the simplified `_lod1`
 * beyond — drawn as two instanced meshes per model, compacted every frame.
 * Nothing is drawn until the pack has loaded (the loading screen waits for
 * it). Positions advance along precomputed lane polylines.
 */
export function Cars() {
  const pack = usePack('vehicles')

  const vehicles = useMemo<Vehicle[]>(() => {
    const r = rng(42)
    // A separate stream picks car models, so changing the mix doesn't move the traffic.
    const pick = rng(4242)
    const mixTotal = CAR_MODELS.reduce((n, m) => n + CAR_MIX[m], 0)
    const carModel = (): CarModel => {
      let x = pick() * mixTotal
      for (const m of CAR_MODELS) if ((x -= CAR_MIX[m]) < 0) return m
      return 'sedan'
    }
    const out: Vehicle[] = []
    for (const { line, width } of trafficLines()) {
      const lane = makeLane(line, width * 0.22)
      const mid = line[Math.floor(line.length / 2)]
      // Dense in town, thinning out into the countryside.
      const density = Math.max(0.12, 1 - Math.hypot(mid[0], mid[1]) / 160)
      const count = Math.round((lane.length / CAR_SPACING) * density)
      // One speed per lane and evenly spread (with a little jitter): cars
      // never catch up with, or drive through, the one ahead.
      const speed = 2 + r() * 1.2
      const offset = r()
      for (let i = 0; i < count; i++) {
        const start = ((i + offset + (r() - 0.5) * 0.4) / count) * lane.length
        out.push({ lane, start: (start + lane.length) % lane.length, speed, model: carModel() })
      }
    }
    return out
  }, [])

  /** Instance capacity per model (each LOD can hold all of them). */
  const capacity = useMemo(() => {
    const n = zeroCounts()
    for (const v of vehicles) n[v.model]++
    return n
  }, [vehicles])

  const carLights = useRef<THREE.InstancedMesh>(null)
  /** Detailed meshes by model name; `<name>_lod1` for the far ones. */
  const meshes = useRef<Record<string, THREE.InstancedMesh | null>>({})

  // Two headlights and two tail lights, coloured per vertex (HDR).
  const lightsGeo = useMemo(
    () =>
      lightsGeometry([
        [0.255, 0.1, 0.08, '#fff2d6', 3],
        [0.255, 0.1, -0.08, '#fff2d6', 3],
        [-0.255, 0.11, 0.08, '#ff2a1a', 2.2],
        [-0.255, 0.11, -0.08, '#ff2a1a', 2.2],
      ]),
    [],
  )

  /** Created on the first frame; the vehicle descriptors are never mutated. */
  const sim = useRef<{
    d: THREE.Object3D
    /** Distance along each car's lane. */
    s: Float32Array
    /** Segment-index cache: progress is monotonic, so lookups stay O(1). */
    seg: Int32Array
    /** Instances written to each model's near / far mesh this frame. */
    near: Record<CarModel, number>
    far: Record<CarModel, number>
  } | null>(null)

  useFrame(({ camera }, delta) => {
    const lamps = carLights.current
    if (!pack || !lamps) return
    // Lights fade in after dusk and are skipped entirely by day.
    const night = daylight.night.value
    const lightsOn = night > 0.04
    lamps.visible = lightsOn
    ;(lamps.material as THREE.MeshBasicMaterial).color.setScalar(night)

    sim.current ??= {
      d: new THREE.Object3D(),
      s: Float32Array.from(vehicles, (v) => v.start),
      seg: new Int32Array(vehicles.length),
      near: zeroCounts(),
      far: zeroCounts(),
    }
    const { d, s: progress, seg: segs, near, far } = sim.current
    const dt = Math.min(delta, 0.1)
    const lod2 = LOD_DISTANCE * LOD_DISTANCE
    const cam = camera.position
    for (const m of CAR_MODELS) near[m] = far[m] = 0

    vehicles.forEach((v, i) => {
      const L = v.lane
      const s = (progress[i] + v.speed * TRAFFIC_SPEED * dt) % L.length
      progress[i] = s
      let seg = segs[i]
      if (s < L.cum[seg]) seg = 0
      while (seg < L.pts.length - 2 && L.cum[seg + 1] < s) seg++
      segs[i] = seg
      const a = L.pts[seg]
      const b = L.pts[seg + 1]
      const k = (s - L.cum[seg]) / (L.cum[seg + 1] - L.cum[seg] || 1)
      const x = a[0] + (b[0] - a[0]) * k
      const z = a[1] + (b[1] - a[1]) * k
      const y = roadY(x, z)
      d.position.set(x, y, z)
      d.rotation.set(0, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0)
      d.updateMatrix()
      if (lightsOn) lamps.setMatrixAt(i, d.matrix)

      const dx = x - cam.x
      const dy = y - cam.y
      const dz = z - cam.z
      if (dx * dx + dy * dy + dz * dz < lod2) meshes.current[v.model]?.setMatrixAt(near[v.model]++, d.matrix)
      else meshes.current[`${v.model}_lod1`]?.setMatrixAt(far[v.model]++, d.matrix)
    })
    if (lightsOn) lamps.instanceMatrix.needsUpdate = true

    for (const m of CAR_MODELS) {
      for (const [mesh, n] of [
        [meshes.current[m], near[m]],
        [meshes.current[`${m}_lod1`], far[m]],
      ] as const) {
        if (!mesh) continue
        mesh.count = n
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  })

  if (!pack) return null
  return (
    <group>
      {CAR_MODELS.flatMap((m) =>
        capacity[m]
          ? [m, `${m}_lod1`].map((name) => (
              <instancedMesh
                key={name}
                ref={(el) => {
                  // A new mesh draws nothing until the frame loop has placed it.
                  if (el && meshes.current[name] !== el) el.count = 0
                  meshes.current[name] = el
                }}
                args={[pack.geometry[name], pack.material[name], capacity[m]]}
                castShadow
                frustumCulled={false}
              />
            ))
          : [],
      )}
      <instancedMesh ref={carLights} args={[lightsGeo, undefined, vehicles.length]} frustumCulled={false} visible={false}>
        <meshBasicMaterial vertexColors />
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

/** How deep the models' hulls sit in the water. */
const DRAFT = 0.07

/**
 * Boats from `boats.glb`: river cruisers running up and down the Han, and
 * fishing boats, a tug, a sailboat and a speedboat out in the bay and off My
 * Khe. Each follows its own loop and bobs on the swell.
 */
export function Boats() {
  const pack = usePack('boats')
  const boats = useMemo(() => {
    const center = riverSamples()
      .filter((s) => s.t > 0.08 && s.t < 0.98)
      .map((s) => [s.x, s.z] as const)
    return [
      { model: 'river-cruise', curve: outAndBack(center, 1.1), speed: 0.012, u: 0.1 },
      { model: 'river-cruise-tall', curve: outAndBack(center, 1.1), speed: 0.012, u: 0.6 },
      { model: 'fishing', curve: loop(circle(-12, -38, 7, 4)), speed: 0.018, u: 0 },
      { model: 'tug', curve: loop(circle(6, -42, 5, 3)), speed: -0.022, u: 0.4 },
      { model: 'sail', curve: loop(circle(40, 8, 4, 9)), speed: 0.014, u: 0.2 },
      { model: 'speed', curve: loop(circle(46, -10, 3, 5)), speed: -0.02, u: 0.7 },
      { model: 'fishing', curve: loop(circle(-24, -34, 4, 2.5)), speed: -0.016, u: 0.5 },
    ]
  }, [])

  const refs = useRef<(THREE.Mesh | null)[]>([])
  /** Progress along each loop, mutated only in the frame loop. */
  const progress = useRef<Float32Array | null>(null)
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, delta) => {
    progress.current ??= Float32Array.from(boats, (b) => b.u)
    const u = progress.current
    const time = clock.elapsedTime
    const dt = Math.min(delta, 0.1)
    boats.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      u[i] = (((u[i] + b.speed * dt) % 1) + 1) % 1
      b.curve.getPointAt(u[i], p)
      b.curve.getTangentAt(u[i], t)
      const dir = Math.sign(b.speed) || 1
      g.position.set(p.x, WORLD.waterY - DRAFT + Math.sin(time * 1.8 + i) * 0.03, p.z)
      g.rotation.set(Math.sin(time * 1.3 + i) * 0.05, Math.atan2(-t.z * dir, t.x * dir), Math.cos(time * 1.1 + i) * 0.05)
    })
  })

  if (!pack) return null
  return (
    <group>
      {boats.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => void (refs.current[i] = el)}
          geometry={pack.geometry[b.model]}
          material={pack.material[b.model]}
          castShadow
        />
      ))}
    </group>
  )
}
