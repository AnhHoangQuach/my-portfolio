'use client'

import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import type { Quality } from '@/lib/world/quality'
import type { ModelPack, PackStyle } from './model-loader'

/**
 * The world's glTF model packs (see `scripts/build-models.mjs`). Each is
 * downloaded once, compiled once, and shared by every component using it.
 * Loading starts when the canvas mounts; `ReadySignal` holds the loading
 * screen until the packs for this tier are in, so the first frame the
 * visitor sees already has them.
 */
export type PackName = 'vehicles' | 'buildings' | 'boats'

const PACKS: Record<PackName, { url: string; style: PackStyle }> = {
  vehicles: { url: '/models/vehicles.glb', style: 'plain' },
  buildings: { url: '/models/buildings.glb', style: 'kit-building' },
  boats: { url: '/models/boats.glb', style: 'plain' },
}

/** The low tier keeps its procedural buildings; traffic and boats are always models. */
export function packsFor(quality: Quality): PackName[] {
  return quality === 'high' ? ['vehicles', 'buildings', 'boats'] : ['vehicles', 'boats']
}

const pending = new Map<PackName, Promise<ModelPack>>()
const loaded = new Map<PackName, ModelPack>()

interface Renderer {
  gl: THREE.WebGLRenderer
  camera: THREE.Camera
  scene: THREE.Scene
}

/** Download, decode and pre-compile a pack; the same promise for every caller. */
export function loadPack(name: PackName, { gl, camera, scene }: Renderer): Promise<ModelPack> {
  let p = pending.get(name)
  if (!p) {
    p = import('./model-loader').then(async ({ loadModelPack }) => {
      const pack = await loadModelPack(PACKS[name].url, PACKS[name].style)
      // Compile the instanced programs off-screen, so swapping in never hitches.
      const warm = new THREE.Group()
      for (const [model, geometry] of Object.entries(pack.geometry)) {
        warm.add(new THREE.InstancedMesh(geometry, pack.material[model], 1))
      }
      await gl.compileAsync?.(warm, camera, scene).catch(() => undefined)
      loaded.set(name, pack)
      return pack
    })
    // A failed download stays failed for this page: the scene goes on without it.
    pending.set(name, p)
  }
  return p
}

/** A pack, or `null` until it's ready (and always `null` when not `enabled`). */
export function usePack(name: PackName, enabled = true) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const [pack, setPack] = useState<ModelPack | null>(() => loaded.get(name) ?? null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadPack(name, { gl, camera, scene }).then(
      (p) => !cancelled && setPack(p),
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [name, enabled, gl, scene, camera])

  return enabled ? pack : null
}

export type { ModelPack }
