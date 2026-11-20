import {
  EAST_COAST,
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
  [-13]: [-24.2, 45],
  [-22]: [-23.2, 41],
  [-31]: [-21.6, 35],
  [-40]: [-15.4, 28.4],
}
const STREETS_Z = [-16, -6, 8, 18, 28] as const
const STREET_WEST_X: Record<number, number> = {
  [-16]: -39,
  [-6]: -45.4,
  [8]: -47.6,
  [18]: -45.6,
  [28]: -40.6,
}

function straight(a: XZ, b: XZ): XZ[] {
  return [a, b]
}

export const roads: Road[] = [
  { line: westRiverRoad, width: 1.3, kind: 'road' },
  { line: eastRiverRoad, width: 1.3, kind: 'road' },
  { line: riverParallel(0.62, 0.02, 0.97), width: 0.7, kind: 'promenade' },
  { line: riverParallel(-0.62, 0.02, 0.95), width: 0.7, kind: 'promenade' },
  { line: coastalRoad, width: 1.3, kind: 'road' },
  // Main east–west axis through the Dragon Bridge, out to the beach.
  { line: straight([-47, 0], [riverRoadX('west', 0), 0]), width: 1.5, kind: 'road' },
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
  const lot = 2.3
  for (const b of blocks) {
    const nx = Math.max(1, Math.floor((b.x1 - b.x0) / lot))
    const nz = Math.max(1, Math.floor((b.z1 - b.z0) / lot))
    const sx = (b.x1 - b.x0) / nx
    const sz = (b.z1 - b.z0) / nz
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const x = b.x0 + sx * (i + 0.5)
        const z = b.z0 + sz * (j + 0.5)
        if (inReserved(x, z, 0.8) || !isLand(x, z, 1.2)) continue
        if (r() < 0.12) continue // breathing room: courtyards and gaps
        // Taller close to the river and the Dragon Bridge axis.
        const riverDist = Math.max(0, riverBankDistance(x, z))
        const core = Math.exp(-riverDist / 9) * Math.exp(-Math.abs(z + 2) / 16)
        let h = 0.9 + r() * 1.3 + core * (2 + r() * 3.5)
        if (core > 0.35 && r() < 0.28) h += 3 + r() * 4.5 // riverfront towers
        const w = Math.min(sx - 0.45, 1.25 + r() * 0.8)
        const d = Math.min(sz - 0.45, 1.25 + r() * 0.8)
        out.push({
          x: x + (r() - 0.5) * 0.25,
          z: z + (r() - 0.5) * 0.25,
          w,
          d,
          h,
          rot: 0,
          wall: pick(r, palette.walls),
          roof: pick(r, palette.roofs),
          roofKind: h > 3.4 ? 'flat' : r() < 0.5 ? 'hip' : r() < 0.5 ? 'gable' : 'flat',
          city: true,
        })
      }
    }
  }
  return out
}

/** Low houses and beachfront hotels on the east bank. */
function generateEastBuildings(): Building[] {
  const r = rng(19)
  const out: Building[] = []
  // Hotel row along the coastal road.
  for (let z = -11; z <= 27; z += 2.6) {
    if (Math.abs(z) < 1.6 || Math.abs(z - 14) < 1.4) continue
    const roadX = coastalRoad.reduce(
      (best, p) => (Math.abs(p[1] - z) < Math.abs(best[1] - z) ? p : best),
      coastalRoad[0],
    )[0]
    const x = roadX - 1.9
    if (!isLand(x, z, 1) || inReserved(x, z, 0.6) || nearRoad(x, z, 0.5)) continue
    out.push({
      x,
      z,
      w: 1.5,
      d: 1.8,
      h: 2.2 + r() * 4,
      rot: 0,
      wall: pick(r, palette.walls),
      roof: pick(r, palette.roofs),
      roofKind: 'flat',
      city: false,
    })
  }
  // Neighbourhood between the river and the hotels.
  for (let i = 0; i < 260 && out.length < 120; i++) {
    const x = 3 + r() * 13
    const z = -20 + r() * 42
    if (!isLand(x, z, 1.4) || riverBankDistance(x, z) < 3.4) continue
    if (nearRoad(x, z, 0.9) || inReserved(x, z, 1.2) || inBeach(x, z)) continue
    if (z > 18 || onSonTra(x, z)) continue
    if (out.some((b) => Math.abs(b.x - x) < 1.9 && Math.abs(b.z - z) < 1.9)) continue
    out.push({
      x,
      z,
      w: 1 + r() * 0.5,
      d: 1 + r() * 0.5,
      h: 0.7 + r() * 1.2,
      rot: (Math.floor(r() * 4) * Math.PI) / 2,
      wall: pick(r, palette.walls),
      roof: pick(r, palette.roofs),
      roofKind: r() < 0.6 ? 'hip' : 'gable',
      city: false,
    })
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

function buildingAt(list: Building[], x: number, z: number, pad: number) {
  return list.some(
    (b) => Math.abs(b.x - x) < b.w * 0.5 + pad && Math.abs(b.z - z) < b.d * 0.5 + pad,
  )
}

const TREE_GREENS = ['#9CCB8A', '#86BC7C', '#A9D49A', '#7FB27A', '#B5D8A4']
const FOREST_GREENS = ['#6A9C89', '#5F9179', '#77A88A', '#548470', '#82B08F']

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
const cityBuildings = generateBuildings(blocks)
const eastBuildings = generateEastBuildings()
const allBuildings = [...cityBuildings, ...eastBuildings]

export const layout = {
  blocks,
  parks,
  cityBuildings,
  eastBuildings,
  trees: generateTrees(allBuildings, parks),
  forest: generateForest(),
  palms: generatePalms(),
  umbrellas: generateUmbrellas(),
}

export { SON_TRA_DOMES, MARBLE_PEAKS, pointInPolygon }
