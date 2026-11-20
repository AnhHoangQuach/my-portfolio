import * as THREE from 'three'

/**
 * Geography of the miniature: the Han River, the two banks, the coastline and
 * the hills. Everything that needs to know "is this point land?" or "how high
 * is the ground here?" asks this module, so models, roads, trees and cars
 * never disagree about the shape of the city.
 */

export type XZ = readonly [number, number]

export const WORLD = {
  /** Half-size of the shoreline mask (foam, shallows) around the city. */
  shoreExtent: 240,
  waterY: -0.5,
  seabedY: -2.2,
  landTop: 0,
} as const

/* ------------------------------------------------------------------------ */
/* Deterministic randomness                                                  */
/* ------------------------------------------------------------------------ */

/** mulberry32 — small, fast, seedable. The world is identical on every load. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ------------------------------------------------------------------------ */
/* Han River                                                                 */
/* ------------------------------------------------------------------------ */

/** Centreline, south → north. It opens into Da Nang Bay at the north end. */
const RIVER_POINTS: XZ[] = [
  [-6, 52],
  [-3, 34],
  [1, 20],
  [0, 8],
  [0.5, -2],
  [2.5, -12],
  [5, -20],
  [7.5, -28],
]

export const riverCurve = new THREE.CatmullRomCurve3(
  RIVER_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'centripetal',
)

/** Half-width of the river at curve parameter `t` (0 = south, 1 = mouth). */
export function riverHalfWidth(t: number) {
  return 3.1 + 1.7 * t * t
}

export interface RiverSample {
  t: number
  x: number
  z: number
  hw: number
  /** Unit normal pointing to the west bank. */
  nx: number
  nz: number
}

const RIVER_SAMPLES: RiverSample[] = (() => {
  const out: RiverSample[] = []
  const n = 240
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = riverCurve.getPointAt(t)
    const d = riverCurve.getTangentAt(t)
    const len = Math.hypot(d.x, d.z) || 1
    // Tangent (tx, tz) rotated so it points west (−x) for a northbound river.
    out.push({ t, x: p.x, z: p.z, hw: riverHalfWidth(t), nx: d.z / len, nz: -d.x / len })
  }
  return out
})()

export function riverSamples() {
  return RIVER_SAMPLES
}

/** River centre, half-width and west normal at a given latitude (z). */
export function riverAtZ(z: number): RiverSample {
  const s = RIVER_SAMPLES
  // Samples run with decreasing z.
  if (z >= s[0].z) return s[0]
  if (z <= s[s.length - 1].z) return s[s.length - 1]
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i]
    const b = s[i + 1]
    if (z <= a.z && z >= b.z) {
      const k = (a.z - z) / (a.z - b.z || 1)
      return {
        t: lerp(a.t, b.t, k),
        x: lerp(a.x, b.x, k),
        z,
        hw: lerp(a.hw, b.hw, k),
        nx: lerp(a.nx, b.nx, k),
        nz: lerp(a.nz, b.nz, k),
      }
    }
  }
  return s[0]
}

/**
 * A line running parallel to the river. Positive `offset` is on the west
 * bank, negative on the east bank, measured from the water's edge outward.
 */
export function riverParallel(offset: number, tFrom = 0, tTo = 1): XZ[] {
  const side = Math.sign(offset) || 1
  return RIVER_SAMPLES.filter((s) => s.t >= tFrom && s.t <= tTo).map((s) => {
    const d = side * (s.hw + Math.abs(offset))
    return [s.x + s.nx * d, s.z + s.nz * d] as const
  })
}

/** X of a river-parallel line at latitude `z`. */
export function riverParallelX(offset: number, z: number) {
  const s = riverAtZ(z)
  const side = Math.sign(offset) || 1
  return s.x + s.nx * side * (s.hw + Math.abs(offset))
}

/** Distance from (x, z) to the nearest water's edge of the river (negative = in the water). */
export function riverBankDistance(x: number, z: number) {
  let best = Infinity
  for (const s of RIVER_SAMPLES) {
    const d = Math.hypot(x - s.x, z - s.z) - s.hw
    if (d < best) best = d
  }
  return best
}

/* ------------------------------------------------------------------------ */
/* Land masses                                                               */
/* ------------------------------------------------------------------------ */

/**
 * Beyond the city the Han River keeps running south, out of view. Only the
 * land outline needs it, so it's a plain polyline rather than part of
 * `riverCurve` (whose parameter the city layout depends on).
 */
const RIVER_SOUTH: XZ[] = [
  [-26, 520],
  [-20, 380],
  [-12, 240],
  [-15, 160],
  [-10, 95],
  [-6, 52],
]
const RIVER_SOUTH_HALF_WIDTH = 3.1

function riverSouthBank(side: 1 | -1): XZ[] {
  return RIVER_SOUTH.slice(0, -1).map((p, i) => {
    const q = RIVER_SOUTH[i + 1]
    const dx = q[0] - p[0]
    const dz = q[1] - p[1]
    const len = Math.hypot(dx, dz) || 1
    // Same convention as RIVER_SAMPLES: (tz, -tx) points west for a northbound river.
    return [p[0] + (dz / len) * side * RIVER_SOUTH_HALF_WIDTH, p[1] + (-dx / len) * side * RIVER_SOUTH_HALF_WIDTH] as const
  })
}

/** Half-extent of the mainland, well past the haze at the horizon. */
export const FAR = 520

/** West bank: the city centre (Hai Chau) and the mainland behind it, up to Hai Van. */
export const WEST_LAND: XZ[] = [
  ...riverSouthBank(1),
  ...riverParallel(0.001).filter((_, i, a) => i % 4 === 0 || i === a.length - 1),
  [-6, -27.2],
  [-16, -25.6],
  [-28, -24],
  [-38, -19],
  // The bay curls north-west toward the Hai Van massif.
  [-52, -23],
  [-74, -31],
  [-98, -46],
  [-118, -70],
  [-132, -100],
  [-140, -140],
  [-150, -200],
  [-FAR, -200],
  [-FAR, FAR],
]

/** Coastline of the east bank from south to north, ending at Son Tra's neck. */
export const EAST_COAST: XZ[] = [
  [26, 50],
  [22.4, 36],
  [22.6, 28],
  [24.6, 16],
  [25.6, 4],
  [25.4, -6],
  [24.8, -14],
]

/** East bank: Son Tra district, My Khe beach, Son Tra and the coast toward Hoi An. */
export const EAST_LAND: XZ[] = [
  ...riverParallel(-0.001)
    .filter((_, i, a) => i % 4 === 0 || i === a.length - 1)
    .reverse(),
  ...riverSouthBank(-1).reverse(),
  [150, FAR],
  // Long straight beaches running south toward Hoi An.
  [112, 400],
  [82, 290],
  [58, 190],
  [42, 120],
  [32, 78],
  ...EAST_COAST,
  // Son Tra peninsula, clockwise around the headland.
  [28, -20],
  [35, -22],
  [40.5, -28],
  [41, -36],
  [35, -42],
  [27, -45],
  [20, -43],
  [16, -37],
  [16.5, -30],
  [14, -25.6],
]

/** Distance to the Han River south of the city (the stretch outside `riverCurve`). */
export function southRiverDistance(x: number, z: number) {
  return distanceToPolyline(x, z, RIVER_SOUTH) - RIVER_SOUTH_HALF_WIDTH
}

export function pointInPolygon(x: number, z: number, poly: readonly XZ[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

function distanceToSegment(px: number, pz: number, a: XZ, b: XZ) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len2 = dx * dx + dz * dz || 1
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / len2))
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t))
}

export function distanceToPolyline(x: number, z: number, line: readonly XZ[]) {
  let best = Infinity
  for (let i = 0; i < line.length - 1; i++) {
    const d = distanceToSegment(x, z, line[i], line[i + 1])
    if (d < best) best = d
  }
  return best
}

function distanceToPolygonEdge(x: number, z: number, poly: readonly XZ[]) {
  return distanceToPolyline(x, z, [...poly, poly[0]])
}

/** True when (x, z) is on land with at least `margin` units to the edge. */
export function isLand(x: number, z: number, margin = 0) {
  for (const poly of [WEST_LAND, EAST_LAND]) {
    if (pointInPolygon(x, z, poly)) return distanceToPolygonEdge(x, z, poly) >= margin
  }
  return false
}

/* ------------------------------------------------------------------------ */
/* Hills                                                                     */
/* ------------------------------------------------------------------------ */

export interface Dome {
  x: number
  z: number
  rx: number
  rz: number
  h: number
}

/** Son Tra's forested hills. */
export const SON_TRA_DOMES: Dome[] = [
  { x: 30, z: -34, rx: 9, rz: 8, h: 6.8 },
  { x: 36.5, z: -30.5, rx: 5.2, rz: 5.8, h: 4.6 },
  { x: 22.5, z: -38, rx: 6, rz: 5, h: 4.2 },
  { x: 30.5, z: -41.5, rx: 6.5, rz: 3.6, h: 3.4 },
  { x: 37, z: -38, rx: 4, rz: 4.2, h: 3.6 },
]

/** Ground height of the Son Tra hills at (x, z); 0 on the flat. */
export function hillHeight(x: number, z: number) {
  let h = 0
  for (const d of SON_TRA_DOMES) {
    const u = (x - d.x) / d.rx
    const v = (z - d.z) / d.rz
    const k = 1 - u * u - v * v
    if (k > 0) h = Math.max(h, d.h * Math.sqrt(k))
  }
  return h
}

export interface Peak {
  x: number
  z: number
  r: number
  h: number
  seed: number
}

/** The five Marble Mountains (Ngu Hanh Son) — Thuy Son is the tallest. */
export const MARBLE_PEAKS: Peak[] = [
  { x: 10, z: 27, r: 3, h: 10.5, seed: 11 },
  { x: 15.4, z: 31, r: 2.1, h: 6.6, seed: 23 },
  { x: 5.8, z: 32.4, r: 1.9, h: 5.4, seed: 37 },
  { x: 15, z: 22.6, r: 2.2, h: 7.2, seed: 41 },
  { x: 9.6, z: 35.8, r: 2.4, h: 4.9, seed: 53 },
]

/* ------------------------------------------------------------------------ */
/* Far terrain                                                               */
/* ------------------------------------------------------------------------ */

function hash2(x: number, z: number) {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return h - Math.floor(h)
}

function valueNoise(x: number, z: number) {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  const a = hash2(xi, zi)
  const b = hash2(xi + 1, zi)
  const c = hash2(xi, zi + 1)
  const d = hash2(xi + 1, zi + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v)
}

/** Ridged fractal noise in [0, 1]: sharp crests, soft valleys. */
function ridged(x: number, z: number) {
  let sum = 0
  let amp = 0.5
  let f = 1
  for (let o = 0; o < 5; o++) {
    const n = 1 - Math.abs(valueNoise(x * f, z * f) * 2 - 1)
    sum += n * n * amp
    amp *= 0.5
    f *= 2.03
  }
  return sum
}

const smooth = (a: number, b: number, t: number) => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

const gauss = (x: number, z: number, cx: number, cz: number, r: number) =>
  Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r))

/**
 * Height of the distant countryside and mountains. Flat around the city (so
 * the extruded land and the far terrain meet cleanly), rising with distance:
 * the Hai Van massif to the north-west above the bay, the Ba Na hills to the
 * west, low rolling country to the south.
 */
export function farTerrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z)
  const ramp = smooth(85, 210, r)
  if (ramp <= 0) return 0
  const relief = ridged(x * 0.011 + 3.1, z * 0.011 - 1.7)
  // Peaks top out around 3–4x the tallest tower, as from Da Nang's riverfront.
  const massifs =
    40 * gauss(x, z, -235, -265, 130) + // Hai Van
    46 * gauss(x, z, -380, 30, 160) + // Ba Na
    16 * gauss(x, z, -160, 250, 140)
  const rolling = 4 + 8 * valueNoise(x * 0.02, z * 0.02)
  return ramp * (rolling + massifs) * (0.5 + 0.6 * relief)
}

/* ------------------------------------------------------------------------ */
/* Geometry helpers                                                          */
/* ------------------------------------------------------------------------ */

/**
 * A flat strip following `line`, `width` wide. `heightAt` lets the strip
 * drape over terrain. UV.x runs along the strip (in world units), UV.y across.
 */
export function ribbonGeometry(
  line: readonly XZ[],
  width: number,
  heightAt: (x: number, z: number) => number,
  closed = false,
) {
  const pts = closed ? [...line, line[0]] : line
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let dist = 0
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(pts.length - 1, i + 1)]
    let dx = next[0] - prev[0]
    let dz = next[1] - prev[1]
    const len = Math.hypot(dx, dz) || 1
    dx /= len
    dz /= len
    const nx = -dz
    const nz = dx
    if (i > 0) dist += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    for (const side of [-1, 1]) {
      const x = pts[i][0] + nx * side * width * 0.5
      const z = pts[i][1] + nz * side * width * 0.5
      positions.push(x, heightAt(x, z), z)
      uvs.push(dist, side < 0 ? 0 : 1)
    }
    if (i < pts.length - 1) {
      const a = i * 2
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  // Strips wound either way should face up.
  const n = geometry.getAttribute('normal')
  if (n.count && n.getY(0) < 0) {
    geometry.setIndex(indices.map((_, k, arr) => arr[k - (k % 3) + (2 - (k % 3))]))
    geometry.computeVertexNormals()
  }
  return geometry
}

/** Evenly resample a polyline by arc length. */
export function resample(line: readonly XZ[], step: number): XZ[] {
  const curve = new THREE.CatmullRomCurve3(
    line.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'centripetal',
  )
  const n = Math.max(2, Math.ceil(curve.getLength() / step))
  return curve.getSpacedPoints(n).map((p) => [p.x, p.z] as const)
}

/** World-space XZ polygon → THREE.Shape for an extrusion rotated −90° about X. */
export function shapeFromXZ(poly: readonly XZ[]) {
  const shape = new THREE.Shape()
  poly.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)))
  shape.closePath()
  return shape
}
