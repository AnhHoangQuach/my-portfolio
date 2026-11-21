#!/usr/bin/env node
/**
 * Builds the world's glTF model packs from the sources in `assets/models/`:
 *
 *   public/models/vehicles.glb   cars
 *   public/models/buildings.glb  city buildings and towers
 *   public/models/boats.glb      river and bay boats
 *
 * Run with `pnpm models` after adding or swapping a model.
 *
 * Every source becomes ONE mesh (one draw call per model when instanced),
 * plus a simplified `<name>_lod1` mesh for distant instances. Vertices are
 * welded, reordered, quantized and meshopt-compressed; tangents are dropped
 * (the city is Lambert-lit).
 *
 * Normalisation, per pack:
 * - `length` (vehicles, boats): forward turned from +Z (sources) to +X, the
 *   scene's convention; centred; resting on y = 0; uniformly scaled so the
 *   model is `length` world units long.
 * - `native` (buildings): centred on the footprint, resting on y = 0, kit
 *   units kept; the scene scales each instance to its lot.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Document, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import {
  clearNodeParent,
  clearNodeTransform,
  dedup,
  getBounds,
  join,
  mergeDocuments,
  prune,
  quantize,
  reorder,
  simplify,
  transformMesh,
  unpartition,
  weld,
} from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (p) => path.join(root, 'assets/models', p)

const CARS = 'kenney-car-kit'
const CITY = 'kenney-city-kit-commercial'
const BOATS = 'kenney-watercraft-kit'

/**
 * `lod`: fraction of triangles kept in `<name>_lod1` (omit for no LOD);
 * `lodError`: how far (relative to the model's size) simplification may move
 * the surface — UV seams stop it early unless this is generous.
 * Lengths are world units (a car is ~0.5, a river boat ~1.2).
 */
const PACKS = [
  {
    out: 'public/models/vehicles.glb',
    mode: 'length',
    models: [
      { name: 'sedan', file: `${CARS}/sedan.glb`, length: 0.5, lod: 0.12 },
      { name: 'taxi', file: `${CARS}/taxi.glb`, length: 0.5, lod: 0.12 },
      { name: 'hatchback', file: `${CARS}/hatchback-sports.glb`, length: 0.48, lod: 0.12 },
      { name: 'suv', file: `${CARS}/suv.glb`, length: 0.52, lod: 0.12 },
      { name: 'van', file: `${CARS}/van.glb`, length: 0.52, lod: 0.12 },
      { name: 'pickup', file: `${CARS}/truck.glb`, length: 0.54, lod: 0.12 },
    ],
  },
  {
    out: 'public/models/buildings.glb',
    mode: 'native',
    models: [
      ...'abcdefghijklmn'.split('').map((c) => ({ name: `building-${c}`, file: `${CITY}/building-${c}.glb`, lod: 0.1, lodError: 0.08 })),
      ...'abcde'.split('').map((c) => ({
        name: `skyscraper-${c}`,
        file: `${CITY}/building-skyscraper-${c}.glb`,
        lod: 0.1,
        lodError: 0.08,
      })),
    ],
  },
  {
    out: 'public/models/boats.glb',
    mode: 'length',
    models: [
      { name: 'river-cruise', file: `${BOATS}/boat-house-a.glb`, length: 1.25 },
      { name: 'river-cruise-tall', file: `${BOATS}/boat-house-c.glb`, length: 1.3 },
      { name: 'fishing', file: `${BOATS}/boat-fishing-small.glb`, length: 0.95 },
      { name: 'tug', file: `${BOATS}/boat-tug-a.glb`, length: 1 },
      { name: 'sail', file: `${BOATS}/boat-sail-a.glb`, length: 1.05 },
      { name: 'speed', file: `${BOATS}/boat-speed-d.glb`, length: 0.85 },
    ],
  },
]

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

/** One source file → a document holding a single, normalised mesh node. */
async function normalise(model, mode, name, lodRatio) {
  const doc = await io.read(src(model.file))
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]

  // Bake the hierarchy into the vertices, then merge every part into one mesh.
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh()) {
      clearNodeParent(node)
      clearNodeTransform(node)
    }
  }
  await doc.transform(join({ keepNamed: false }), prune())

  const meshes = doc.getRoot().listMeshes()
  if (meshes.length !== 1) throw new Error(`${model.file}: expected one mesh after join, got ${meshes.length}`)
  const mesh = meshes[0]

  const { min, max } = getBounds(scene)
  const cx = (min[0] + max[0]) / 2
  const cz = (min[2] + max[2]) / 2
  if (mode === 'length') {
    // Column-major: scale · rotateY(+90°) · translate(−cx, −minY, −cz);
    // rotateY(90°) maps (x, y, z) → (z, y, −x), so +Z (forward) becomes +X.
    const k = model.length / (max[2] - min[2])
    // prettier-ignore
    transformMesh(mesh, [
      0, 0, -k, 0,
      0, k, 0, 0,
      k, 0, 0, 0,
      -cz * k, -min[1] * k, cx * k, 1,
    ])
  } else {
    // prettier-ignore
    transformMesh(mesh, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -cx, -min[1], -cz, 1,
    ])
  }

  for (const prim of mesh.listPrimitives()) prim.setAttribute('TANGENT', null)

  if (lodRatio) {
    // Distant copy: drop normals so welding can merge the flat-shaded
    // corners (the scene draws LODs with flat shading), then simplify.
    for (const prim of mesh.listPrimitives()) prim.setAttribute('NORMAL', null)
    await doc.transform(
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: lodRatio, error: model.lodError ?? 0.02, lockBorder: false }),
    )
  }

  mesh.setName(name)
  const node = doc.getRoot().listNodes().find((n) => n.getMesh() === mesh)
  node.setName(name)
  for (const n of doc.getRoot().listNodes()) if (n !== node) n.dispose()
  for (const m of doc.getRoot().listMaterials()) m.setName(`${path.dirname(model.file)}-colormap`)
  return doc
}

const vertexCount = (node) =>
  node.getMesh().listPrimitives().reduce((n, p) => n + p.getAttribute('POSITION').getCount(), 0)

for (const pack of PACKS) {
  const out = new Document()
  for (const model of pack.models) {
    mergeDocuments(out, await normalise(model, pack.mode, model.name))
    if (model.lod) mergeDocuments(out, await normalise(model, pack.mode, `${model.name}_lod1`, model.lod))
  }

  // mergeDocuments adds one scene per source: gather every model into the first.
  const [scene, ...rest] = out.getRoot().listScenes()
  for (const s of rest) {
    for (const n of s.listChildren()) scene.addChild(n)
    s.dispose()
  }
  scene.setName(path.basename(pack.out, '.glb'))
  out.getRoot().setDefaultScene(scene)

  await out.transform(
    unpartition(),
    dedup(),
    weld(),
    reorder({ encoder: MeshoptEncoder }),
    // 8-bit normals and 12-bit UVs are plenty for flat colour swatches.
    quantize({ quantizeNormal: 8, quantizeTexcoord: 12 }),
    prune(),
  )
  out.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
    method: EXTMeshoptCompression.EncoderMethod.FILTER,
  })

  const file = path.join(root, pack.out)
  await mkdir(path.dirname(file), { recursive: true })
  await io.write(file, out)
  const bytes = (await io.writeBinary(out)).byteLength
  console.log(`\n${pack.out} (${(bytes / 1024).toFixed(1)} KB)`)
  const nodes = scene.listChildren()
  for (const node of nodes) {
    if (node.getName().endsWith('_lod1')) continue
    const { min, max } = getBounds(node)
    const size = max.map((v, i) => (v - min[i]).toFixed(3)).join(' × ')
    const lod = nodes.find((n) => n.getName() === `${node.getName()}_lod1`)
    const lodInfo = lod ? ` → lod1 ${vertexCount(lod)}` : ''
    console.log(`  ${node.getName().padEnd(18)} ${String(vertexCount(node)).padStart(5)} verts${lodInfo}  ${size}`)
  }
}
