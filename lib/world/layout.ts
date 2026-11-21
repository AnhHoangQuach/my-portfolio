import {
  EAST_COAST,
  farTerrainHeight,
  southRiverDistance,
  MARBLE_PEAKS,
  SON_TRA_DOMES,
  type XZ,
  distanceToPolyline,
  hillHeight,
  isLand,
  pointInPolygon,
  riverAtZ,
  riverBankDistance,
  riverParallel,
  riverParallelX,
  rng,
  resample,
} from './geo'
import { palette } from './palette'

/**
 * Procedural placement of everything that is not a hand-built landmark:
 * streets, city blocks, buildings, trees, palms, umbrellas. Computed once,
 * deterministically, from the geography in `geo.ts`.
 */

/* ------------------------------------------------------------------------ */
/* Roads                                                                     */
/* ------------------------------------------------------------------------ */

export interface Road {
  line: XZ[]
  width: number
  kind: 'road' | 'promenade'
}

/** Riverfront roads (Bach Dang on the west bank, Tran Hung Dao on the east). */
const RIVER_ROAD_OFFSET = 1.75
export const westRiverRoad = riverParallel(RIVER_ROAD_OFFSET, 0.02, 0.97)
export const eastRiverRoad = riverParallel(-RIVER_ROAD_OFFSET, 0.02, 0.95)

export const riverRoadX = (side: 'west' | 'east', z: number) =>
  riverParallelX(side === 'west' ? RIVER_ROAD_OFFSET : -RIVER_ROAD_OFFSET, z)

/** Coastal road behind My Khe (Vo Nguyen Giap). */
export const coastalRoad: XZ[] = resample(
  EAST_COAST.map(([x, z]) => [x - 5.4, z] as const).filter(([, z]) => z < 32),
  1,
)

/** Bridges crossing the Han River, by latitude. */
export const BRIDGES = {
  hanRiver: -14,
  dragon: 0,
  tranThiLy: 14,
} as const

const AVENUES_X = [-13, -22, -31, -40] as const
const AVENUE_EXTENTS: Record<number, [number, number]> = {
  [-13]: [-24.2, 52],
  [-22]: [-23.2, 52],
  [-31]: [-21.6, 52],
  [-40]: [-15.4, 52],
}
const STREETS_Z = [-16, -6, 8, 18, 28] as const
const STREET_WEST_X: Record<number, number> = {
  [-16]: -39,
  [-6]: -52,
  [8]: -52,
  [18]: -52,
  [28]: -52,
}

function straight(a: XZ, b: XZ): XZ[] {
  return [a, b]
}

/** Roads leading out of the city: the ring highway, south along the river and the coast. */
const OUTSKIRT_ROADS: XZ[][] = [
  // Ring highway west of the centre.
  resample([[-60, -24], [-62, 20], [-58, 70], [-64, 130], [-58, 190]], 2),
  // South along the east bank of the Han.
  resample([[4, 46], [3, 80], [-1, 120], [3, 170], [-2, 230]], 2),
  // Coast road south toward Hoi An.
  resample([[21, 30], [27, 70], [36, 120], [50, 180], [64, 230]], 2),
  // A cross road joining them south of the Marble Mountains.
  resample([[-58, 70], [-30, 74], [-11, 75], [3, 80], [24, 58]], 2),
]

export const roads: Road[] = [
  { line: westRiverRoad, width: 1.3, kind: 'road' },
  { line: eastRiverRoad, width: 1.3, kind: 'road' },
  { line: riverParallel(0.62, 0.02, 0.97), width: 0.7, kind: 'promenade' },
  { line: riverParallel(-0.62, 0.02, 0.95), width: 0.7, kind: 'promenade' },
  { line: coastalRoad, width: 1.3, kind: 'road' },
  // Main east–west axis through the Dragon Bridge, out to the beach, and west
  // out of the city toward the airport and the countryside.
  { line: straight([-175, 0], [riverRoadX('west', 0), 0]), width: 1.5, kind: 'road' },
  ...OUTSKIRT_ROADS.map((line) => ({ line, width: 1.3, kind: 'road' as const })),
  { line: straight([riverRoadX('east', 0), 0], [20.2, 0]), width: 1.5, kind: 'road' },
  // East-bank cross streets at the other two bridges.
  {
    line: straight([riverRoadX('east', BRIDGES.hanRiver), BRIDGES.hanRiver], [19.6, -14]),
    width: 1.2,
    kind: 'road',
  },
  {
    line: straight([riverRoadX('east', BRIDGES.tranThiLy), BRIDGES.tranThiLy], [19.2, 14]),
    width: 1.2,
    kind: 'road',
  },
  ...AVENUES_X.map((x) => ({
    line: straight([x, AVENUE_EXTENTS[x][0]], [x, AVENUE_EXTENTS[x][1]]),
    width: 1.1,
    kind: 'road' as const,
  })),
  ...STREETS_Z.map((z) => ({
    line: straight([STREET_WEST_X[z], z], [riverRoadX('west', z), z]),
    width: 1.1,
    kind: 'road' as const,
  })),
]

function nearRoad(x: number, z: number, pad: number) {
  for (const r of roads) {
    if (distanceToPolyline(x, z, r.line) < r.width * 0.5 + pad) return true
  }
  return false
}

/** Sidewalks run 0.35 either side of every road (see `Roads` in scene/roads.tsx). */
const SIDEWALK = 0.35

/**
 * The whole footprint stays off the road and its sidewalk — corners, edge
 * midpoints and centre, not just the centre, since a deep house's front can
 * reach a road its centre is well clear of.
 */
function footprintClear(b: Pick<Building, 'x' | 'z' | 'w' | 'd' | 'rot'>, pad = SIDEWALK) {
  const c = Math.cos(b.rot)
  const s = Math.sin(b.rot)
  for (const u of [-0.5, 0, 0.5]) {
    for (const v of [-0.5, 0, 0.5]) {
      const lx = u * b.w
      const lz = v * b.d
      if (nearRoad(b.x + lx * c + lz * s, b.z - lx * s + lz * c, pad)) return false
    }
  }
  return true
}

/* ------------------------------------------------------------------------ */
/* Reserved areas                                                            */
/* ------------------------------------------------------------------------ */

interface Circle {
  x: number
  z: number
  r: number
}

/** Ground kept clear for landmarks and hand-placed models. */
const RESERVED: Circle[] = [
  { x: -7.4, z: -10, r: 2.8 }, // administrative tower
  { x: 21.6, z: -24.6, r: 3.2 }, // Linh Ung pagoda terrace
  { x: 7, z: -7.2, r: 2.2 }, // Love Bridge landing
  { x: 10, z: 31.6, r: 2 }, // temple gate
  ...MARBLE_PEAKS.map((p) => ({ x: p.x, z: p.z, r: p.r + 0.9 })),
]

function inReserved(x: number, z: number, pad = 0) {
  return RESERVED.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + pad)
}

/** Sand strip of My Khe, measured inland from the coastline. */
const BEACH_DEPTH = 3.8
export function inBeach(x: number, z: number) {
  if (z > 30 || z < -14) return false
  return distanceToPolyline(x, z, EAST_COAST) < BEACH_DEPTH && x > 15
}

export function onSonTra(x: number, z: number) {
  return z < -18.5 && x > 14
}

/* ------------------------------------------------------------------------ */
/* Buildings                                                                 */
/* ------------------------------------------------------------------------ */

export interface Building {
  x: number
  z: number
  w: number
  d: number
  h: number
  rot: number
  wall: string
  roof: string
  roofKind: 'flat' | 'hip' | 'gable'
  /** Drives rooftop clutter: water tanks on houses, plant rooms on towers. */
  kind: 'house' | 'mid' | 'tower'
  /** Part of the clickable city-centre landmark. */
  city: boolean
}

export interface Block {
  x0: number
  x1: number
  z0: number
  z1: number
}

/** Cells between avenues and streets that stay green. */
const PARK_CELLS = new Set(['-31:8', '-22:18', '-40:-6'])

function cityBlocks(): { blocks: Block[]; parks: Block[] } {
  const xs = [-52, ...[...AVENUES_X].reverse()] // -52, -40, -31, -22, -13
  const zs = [-26, -16, -6, 0, 8, 18, 28, 48]
  const gap = 0.9
  const blocks: Block[] = []
  const parks: Block[] = []
  for (let xi = 0; xi < xs.length; xi++) {
    for (let zi = 0; zi < zs.length - 1; zi++) {
      const z0 = zs[zi] + gap
      const z1 = zs[zi + 1] - gap
      const x0 = xs[xi] + gap
      // The easternmost column runs up to the riverfront road.
      const x1 =
        xi === xs.length - 1
          ? Math.min(riverRoadX('west', z0), riverRoadX('west', z1)) - 1.15
          : xs[xi + 1] - gap
      if (x1 - x0 < 2.4 || z1 - z0 < 2.4) continue
      const block = { x0, x1, z0, z1 }
      if (PARK_CELLS.has(`${xs[xi]}:${zs[zi]}`)) parks.push(block)
      else blocks.push(block)
    }
  }
  return { blocks, parks }
}

/** A block whose four corners are all on solid ground gets a paved plinth. */
export function blockOnLand(b: Block) {
  const m = 0.8
  return (
    isLand(b.x0, b.z0, m) && isLand(b.x1, b.z0, m) && isLand(b.x0, b.z1, m) && isLand(b.x1, b.z1, m)
  )
}

function pick<T>(r: () => number, list: readonly T[]) {
  return list[Math.floor(r() * list.length) % list.length]
}

function generateBuildings(blocks: Block[]): Building[] {
  const r = rng(7)
  const out: Building[] = []
  const free = (x: number, z: number, pad: number) =>
    !inReserved(x, z, pad) && isLand(x, z, 0.8)

  for (const b of blocks) {
    const bw = b.x1 - b.x0
    const bd = b.z1 - b.z0
    // How central this block is: towers cluster by the river and the Dragon Bridge axis.
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    const riverDist = Math.max(0, riverBankDistance(cx, cz))
    const core = Math.exp(-riverDist / 10) * Math.exp(-Math.abs(cz + 2) / 22)
    const depth = Math.min(1.9, Math.min(bw, bd) * 0.32)

    // 1. Tube houses shoulder to shoulder along all four street edges.
    const edges: { horizontal: boolean; fixed: number; from: number; to: number; inward: number }[] = [
      { horizontal: true, fixed: b.z0, from: b.x0, to: b.x1, inward: 1 },
      { horizontal: true, fixed: b.z1, from: b.x0, to: b.x1, inward: -1 },
      { horizontal: false, fixed: b.x0, from: b.z0 + depth, to: b.z1 - depth, inward: 1 },
      { horizontal: false, fixed: b.x1, from: b.z0 + depth, to: b.z1 - depth, inward: -1 },
    ]
    for (const e of edges) {
      let t = e.from + 0.05
      while (t < e.to - 0.5) {
        const front = 0.5 + r() * 0.38
        const d = depth * (0.82 + r() * 0.18)
        const center = t + front / 2
        t += front + (r() < 0.08 ? 0.35 : 0.04) // the odd alley
        const x = e.horizontal ? center : e.fixed + (e.inward * d) / 2
        const z = e.horizontal ? e.fixed + (e.inward * d) / 2 : center
        if (!free(x, z, 0.4)) continue
        const floors = 3 + Math.floor(r() * 4 + core * 4)
        out.push({
          x,
          z,
          w: e.horizontal ? front : d,
          d: e.horizontal ? d : front,
          h: floors * 0.3 + 0.12,
          rot: 0,
          wall: pick(r, palette.facades),
          roof: r() < 0.16 ? pick(r, ['#a5553a', '#b0603d']) : pick(r, palette.roofs.slice(0, 4)),
          roofKind: r() < 0.16 ? 'hip' : 'flat',
          kind: 'house',
          city: true,
        })
      }
    }

    // 2. The block's core: a tower on a podium near the river, else mid-rises.
    const ix0 = b.x0 + depth + 0.3
    const ix1 = b.x1 - depth - 0.3
    const iz0 = b.z0 + depth + 0.3
    const iz1 = b.z1 - depth - 0.3
    if (ix1 - ix0 < 1.2 || iz1 - iz0 < 1.2) continue
    const mx = (ix0 + ix1) / 2
    const mz = (iz0 + iz1) / 2
    if (!free(mx, mz, 1)) continue
    if (core > 0.3 && r() < 0.85) {
      const pw = Math.min(ix1 - ix0, 3.2)
      const pd = Math.min(iz1 - iz0, 3.2)
      out.push({
        x: mx, z: mz, w: pw, d: pd, h: 0.9, rot: 0,
        wall: pick(r, palette.walls), roof: palette.roofs[0], roofKind: 'flat', kind: 'mid', city: true,
      })
      const tw = Math.min(pw * 0.7, 1.4 + r() * 0.8)
      const td = Math.min(pd * 0.7, 1.4 + r() * 0.8)
      out.push({
        x: mx + (r() - 0.5) * 0.3, z: mz + (r() - 0.5) * 0.3, w: tw, d: td,
        h: 4.5 + core * 7 + r() * 5, rot: 0,
        wall: pick(r, palette.walls), roof: palette.roofs[2], roofKind: 'flat', kind: 'tower', city: true,
      })
    } else {
      const n = Math.max(1, Math.floor((ix1 - ix0) / 2.2))
      const sw = (ix1 - ix0) / n
      for (let i = 0; i < n; i++) {
        if (r() < 0.25) continue // courtyards
        const x = ix0 + sw * (i + 0.5)
        if (!free(x, mz, 0.6)) continue
        out.push({
          x, z: mz, w: sw * 0.8, d: Math.min(iz1 - iz0, 2.4) * 0.85,
          h: 1.4 + r() * 1.8 + core * 2, rot: 0,
          wall: pick(r, palette.walls), roof: pick(r, palette.roofs.slice(0, 4)),
          roofKind: 'flat', kind: 'mid', city: true,
        })
      }
    }
  }
  return out
}

/** Distance from (x, z) to the nearest road centreline, minus its half-width. */
function roadClearance(x: number, z: number) {
  let best = Infinity
  for (const rd of roads) {
    const d = distanceToPolyline(x, z, rd.line) - rd.width / 2
    if (d < best) best = d
  }
  return best
}

/** Hotels along the beach road and tube houses through the east bank. */
function generateEastBuildings(): Building[] {
  const r = rng(19)
  const out: Building[] = []
  // Beachfront hotels: tall, mostly glazed.
  for (let z = -11; z <= 27; z += 2.4) {
    if (Math.abs(z) < 1.6 || Math.abs(z - 14) < 1.4) continue
    const roadX = coastalRoad.reduce(
      (best, p) => (Math.abs(p[1] - z) < Math.abs(best[1] - z) ? p : best),
      coastalRoad[0],
    )[0]
    const x = roadX - 1.9
    if (!isLand(x, z, 1) || inReserved(x, z, 0.6) || !footprintClear({ x, z, w: 1.6, d: 1.8, rot: 0 })) continue
    out.push({
      x, z, w: 1.6, d: 1.8, h: 3.5 + r() * 6.5, rot: 0,
      wall: pick(r, palette.walls), roof: palette.roofs[0], roofKind: 'flat', kind: 'tower', city: false,
    })
  }
  // Neighbourhood between the river and the hotels: tube houses facing the streets.
  for (let i = 0; i < 900 && out.length < 420; i++) {
    const x = 3 + r() * 14
    const z = -20 + r() * 44
    if (!isLand(x, z, 1) || riverBankDistance(x, z) < 3.2) continue
    if (inReserved(x, z, 1.1) || inBeach(x, z) || onSonTra(x, z)) continue
    const clear = roadClearance(x, z)
    if (clear < 0.35 || clear > 3.2) continue
    if (out.some((o) => Math.abs(o.x - x) < 0.75 && Math.abs(o.z - z) < 0.75)) continue
    const house = tubeHouse(r, x, z, false)
    if (footprintClear(house)) out.push(house)
  }
  return out
}

function tubeHouse(r: () => number, x: number, z: number, city: boolean): Building {
  const front = 0.55 + r() * 0.35
  const depth = 1.3 + r() * 0.5
  const turned = r() < 0.5
  return {
    x, z,
    w: turned ? depth : front,
    d: turned ? front : depth,
    h: (2 + Math.floor(r() * 4)) * 0.3 + 0.12,
    rot: 0,
    wall: pick(r, palette.facades),
    roof: r() < 0.25 ? pick(r, ['#a5553a', '#b0603d']) : pick(r, palette.roofs.slice(0, 4)),
    roofKind: r() < 0.25 ? 'hip' : 'flat',
    kind: 'house',
    city,
  }
}

/**
 * Suburbs and villages: houses strung along the roads out of the city,
 * thinning with distance, never on hills, in rivers or on the beach.
 */
function generateOutskirts(): Building[] {
  const r = rng(29)
  const out: Building[] = []
  const lines = [...OUTSKIRT_ROADS, straight([-175, 0], [-52, 0])]
  for (const line of lines) {
    const pts = resample(line, 0.9)
    pts.forEach(([px, pz], i) => {
      const dist = Math.hypot(px, pz)
      const density = Math.max(0.08, 1 - (dist - 50) / 160)
      for (const side of [-1, 1]) {
        if (r() > density) continue
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(pts.length - 1, i + 1)]
        const dx = b[0] - a[0]
        const dz = b[1] - a[1]
        const len = Math.hypot(dx, dz) || 1
        const off = 1.6 + r() * 0.9
        const x = px - (dz / len) * off * side
        const z = pz + (dx / len) * off * side
        if (Math.hypot(x, z) < 52 && x > -52) continue // the city grid owns this
        if (!isLand(x, z, 1) || farTerrainHeight(x, z) > 0.25) continue
        if (riverBankDistance(x, z) < 2.5 || southRiverDistance(x, z) < 2.5) continue
        if (inBeach(x, z) || inReserved(x, z, 1)) continue
        const house = tubeHouse(r, x, z, false)
        if (footprintClear(house)) out.push(house)
      }
    })
  }
  // Hamlets scattered among the fields.
  for (let v = 0; v < 26; v++) {
    const a = r() * Math.PI * 2
    const d = 60 + r() * 120
    const vx = Math.cos(a) * d
    const vz = Math.sin(a) * d
    for (let k = 0; k < 14; k++) {
      const x = vx + (r() - 0.5) * 9
      const z = vz + (r() - 0.5) * 9
      if (!isLand(x, z, 1.5) || farTerrainHeight(x, z) > 0.25) continue
      if (riverBankDistance(x, z) < 2.5 || southRiverDistance(x, z) < 2.5 || inBeach(x, z)) continue
      if (Math.hypot(x, z) < 55 && x > -52) continue
      const house = tubeHouse(r, x, z, false)
      if (footprintClear(house)) out.push(house)
    }
  }
  return out
}

/* ------------------------------------------------------------------------ */
/* Vegetation & props                                                        */
/* ------------------------------------------------------------------------ */

export interface TreeInstance {
  x: number
  y: number
  z: number
  s: number
  color: string
}

/** Buildings bucketed on a 4-unit grid, so footprint checks stay cheap. */
const footprintIndex = new WeakMap<Building[], Map<string, Building[]>>()
function buildingAt(list: Building[], x: number, z: number, pad: number) {
  let grid = footprintIndex.get(list)
  if (!grid) {
    grid = new Map()
    for (const b of list) {
      const k = `${Math.floor(b.x / 4)},${Math.floor(b.z / 4)}`
      const bucket = grid.get(k)
      if (bucket) bucket.push(b)
      else grid.set(k, [b])
    }
    footprintIndex.set(list, grid)
  }
  const gx = Math.floor(x / 4)
  const gz = Math.floor(z / 4)
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const bucket = grid.get(`${gx + i},${gz + j}`)
      if (
        bucket?.some(
          (b) => Math.abs(b.x - x) < b.w * 0.5 + pad && Math.abs(b.z - z) < b.d * 0.5 + pad,
        )
      )
        return true
    }
  }
  return false
}

const TREE_GREENS = ['#4f6b34', '#5b7a3b', '#46622f', '#677f40', '#3f5a2c', '#5f7043']
const FOREST_GREENS = ['#34502c', '#2d4627', '#3c5a31', '#2a3f24', '#425f35']

function generateTrees(buildings: Building[], parks: Block[]) {
  const r = rng(101)
  const trees: TreeInstance[] = []
  const add = (x: number, z: number, s: number, list: readonly string[]) =>
    trees.push({ x, y: 0, z, s, color: pick(r, list) })

  // Riverside promenade rows.
  for (const side of [0.15, -0.15]) {
    riverParallel(side, 0.04, 0.95).forEach(([, z], i) => {
      if (i % 5 !== 0) return
      if (Math.abs(z) < 2.2 || Math.abs(z + 14) < 1.6 || Math.abs(z - 14) < 1.6) return
      if (Math.abs(z + 7.2) < 1.6 && side < 0) return
      const s = riverAtZ(z)
      const off = (side > 0 ? 1 : -1) * (s.hw + 1.06)
      add(s.x + s.nx * off, s.z + s.nz * off, 0.42 + r() * 0.12, TREE_GREENS)
    })
  }
  // Parks: loose clumps.
  for (const p of parks) {
    const area = (p.x1 - p.x0) * (p.z1 - p.z0)
    for (let i = 0; i < area / 2.4; i++) {
      const x = p.x0 + 0.6 + r() * (p.x1 - p.x0 - 1.2)
      const z = p.z0 + 0.6 + r() * (p.z1 - p.z0 - 1.2)
      if (!isLand(x, z, 0.8)) continue
      add(x, z, 0.5 + r() * 0.35, TREE_GREENS)
    }
  }
  // Scatter on open ground everywhere else.
  for (let i = 0; i < 2600; i++) {
    const x = -52 + r() * 96
    const z = -46 + r() * 98
    if (!isLand(x, z, 0.7) || onSonTra(x, z)) continue
    if (riverBankDistance(x, z) < 2.6 || nearRoad(x, z, 0.35) || inBeach(x, z)) continue
    if (inReserved(x, z, 0.6) || buildingAt(buildings, x, z, 0.45)) continue
    // Sparse in the dense core, fuller toward the outskirts.
    const urban = x < -4 && x > -41 && z > -22 && z < 38
    if (urban && r() < 0.9) continue
    add(x, z, 0.45 + r() * 0.4, TREE_GREENS)
  }
  // Countryside: tree lines and copses among the fields, thinning outward.
  for (let i = 0; i < 5200; i++) {
    const a = r() * Math.PI * 2
    const d = 48 + r() * 150
    const x = Math.cos(a) * d
    const z = Math.sin(a) * d
    if (x > -52 && d < 52) continue
    if (r() > 1 - (d - 48) / 190) continue
    if (!isLand(x, z, 0.8) || farTerrainHeight(x, z) > 0.25 || onSonTra(x, z)) continue
    if (riverBankDistance(x, z) < 2.2 || southRiverDistance(x, z) < 1.5 || inBeach(x, z)) continue
    if (nearRoad(x, z, 0.3) || buildingAt(buildings, x, z, 0.4)) continue
    add(x, z, 0.5 + r() * 0.5, TREE_GREENS)
  }
  return trees
}

function generateForest() {
  const r = rng(202)
  const trees: TreeInstance[] = []
  for (let i = 0; i < 1400 && trees.length < 340; i++) {
    const x = 15 + r() * 27
    const z = -46 + r() * 27
    if (!isLand(x, z, 0.4) || !onSonTra(x, z)) continue
    if (inReserved(x, z, 0.4)) continue
    const y = hillHeight(x, z)
    // Dense on the hills, thinner on the flats at the foot.
    if (y < 0.2 && r() < 0.55) continue
    trees.push({ x, y: y - 0.12, z, s: 0.5 + r() * 0.45, color: pick(r, FOREST_GREENS) })
  }
  return trees
}

export interface PalmInstance {
  x: number
  z: number
  s: number
  lean: number
  rot: number
}

function generatePalms(): PalmInstance[] {
  const r = rng(303)
  const out: PalmInstance[] = []
  const line = resample(
    EAST_COAST.map(([x, z]) => [x - 3.4, z] as const),
    1.6,
  )
  for (const [x, z] of line) {
    if (z < -12 || z > 29 || Math.abs(z) < 1.4) continue
    if (r() < 0.25) continue
    out.push({
      x: x + (r() - 0.5) * 0.7,
      z: z + (r() - 0.5) * 0.5,
      s: 0.8 + r() * 0.35,
      lean: 0.15 + r() * 0.2,
      rot: r() * Math.PI * 2,
    })
  }
  // A few along the riverfront by the Dragon Bridge.
  for (const z of [-3.2, 3.2, -10.5, 10.5]) {
    out.push({ x: riverRoadX('east', z) + 0.9, z, s: 0.75, lean: 0.12, rot: r() * 6.28 })
  }
  return out
}

export interface Umbrella {
  x: number
  z: number
  color: string
  tilt: number
}

function generateUmbrellas(): Umbrella[] {
  const r = rng(404)
  const out: Umbrella[] = []
  const colors = ['#F28C7B', '#FFF8EB', '#69C5C0', '#F5C76B', '#F2748A']
  const line = resample(
    EAST_COAST.map(([x, z]) => [x - 1.2, z] as const),
    1.35,
  )
  line.forEach(([x, z]) => {
    if (z < -11 || z > 27 || r() < 0.3) return
    out.push({ x: x + (r() - 0.5) * 0.5, z, color: pick(r, colors), tilt: (r() - 0.5) * 0.25 })
  })
  return out
}

/* ------------------------------------------------------------------------ */
/* Assembled layout                                                          */
/* ------------------------------------------------------------------------ */

const { blocks, parks } = cityBlocks()
// Blocks already stop at the sidewalk; this only drops the odd house whose
// front pokes past a curving riverfront road.
const cityBuildings = generateBuildings(blocks).filter((b) => footprintClear(b, 0))
const eastBuildings = generateEastBuildings()
const outskirtBuildings = generateOutskirts()
const allBuildings = [...cityBuildings, ...eastBuildings, ...outskirtBuildings]

export const layout = {
  blocks,
  parks,
  cityBuildings,
  eastBuildings,
  outskirtBuildings,
  trees: generateTrees(allBuildings, parks),
  forest: generateForest(),
  palms: generatePalms(),
  umbrellas: generateUmbrellas(),
}

export { SON_TRA_DOMES, MARBLE_PEAKS, pointInPolygon }

