import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

import { createKitMaterial } from '@/lib/world/materials'

/**
 * Loads one model pack (`public/models/*.glb`, built by `pnpm models`). Only
 * ever reached through the dynamic import in `models.ts`, so GLTFLoader and
 * the meshopt decoder live in their own chunk.
 */

export interface ModelPack {
  /** Geometry per model name; `<name>_lod1` is the simplified copy. */
  geometry: Record<string, THREE.BufferGeometry>
  material: Record<string, THREE.Material>
  /** Bounding-box size per model, in the pack's units. */
  size: Record<string, THREE.Vector3>
}

/** `kit-building`: lit windows after dark (see `createKitMaterial`). */
export type PackStyle = 'plain' | 'kit-building'

/** Quantized attributes back to plain floats, so transforms can't clamp them. */
function dequantize(geometry: THREE.BufferGeometry) {
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const a = attr as THREE.BufferAttribute
    if (a.array instanceof Float32Array && !a.normalized) continue
    const out = new Float32Array(a.count * a.itemSize)
    for (let i = 0; i < a.count; i++) {
      for (let c = 0; c < a.itemSize; c++) out[i * a.itemSize + c] = a.getComponent(i, c)
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize))
  }
  return geometry
}

export async function loadModelPack(url: string, style: PackStyle): Promise<ModelPack> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(url)
  gltf.scene.updateMatrixWorld(true)

  const pack: ModelPack = { geometry: {}, material: {}, size: {} }
  // One material per (atlas, shading) pair, shared by every model using it.
  const materials = new Map<string, THREE.Material>()

  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const name = mesh.name
    // Quantization stores a dequantizing transform on the node: bake it in.
    const g = dequantize(mesh.geometry.clone())
    g.applyMatrix4(mesh.matrixWorld)
    // LODs ship without normals (drawn flat-shaded); shadows still want some.
    const flat = !g.getAttribute('normal')
    if (flat) g.computeVertexNormals()
    g.computeBoundingBox()
    g.computeBoundingSphere()
    pack.geometry[name] = g
    pack.size[name] = g.boundingBox!.getSize(new THREE.Vector3())

    const src = mesh.material as THREE.MeshStandardMaterial
    const key = `${src.map?.uuid ?? 'none'}:${flat}`
    let m = materials.get(key)
    if (!m) {
      m = createKitMaterial(src.map ?? null, { flat, windows: style === 'kit-building', side: src.side })
      materials.set(key, m)
    }
    pack.material[name] = m
  })
  return pack
}
