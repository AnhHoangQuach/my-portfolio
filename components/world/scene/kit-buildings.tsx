'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import type { Building } from '@/lib/world/layout'
import { placeKitBuildings, type Placement } from './kit-placement'
import type { ModelPack } from './models'

/** Full-detail models within this distance of the camera; `_lod1` beyond. */
const LOD_DISTANCE = 42
/** Re-sort LODs only after the camera has moved this far. */
const RESORT_STEP = 1.5

/**
 * Buildings from the glTF kit (high tier): two instanced meshes per model,
 * full detail near the camera and the simplified `_lod1` beyond. The split is
 * redone only when the camera has moved, and buffers are re-uploaded only
 * when some building actually changed side.
 */
export function KitBuildings({ items, pack }: { items: Building[]; pack: ModelPack }) {
  const placements = useMemo(() => placeKitBuildings(items, pack.size), [items, pack])
  const groups = useMemo(() => {
    const byModel = new Map<string, Placement[]>()
    for (const p of placements) {
      const list = byModel.get(p.model)
      if (list) list.push(p)
      else byModel.set(p.model, [p])
    }
    return [...byModel.entries()]
  }, [placements])

  const near = useRef<Record<string, THREE.InstancedMesh | null>>({})
  const far = useRef<Record<string, THREE.InstancedMesh | null>>({})
  /** Per-frame state: last camera position used, and each building's current side. */
  const sim = useRef<{ cam: THREE.Vector3; isNear: Map<Placement, boolean> } | null>(null)

  useFrame(({ camera }) => {
    sim.current ??= { cam: new THREE.Vector3(Infinity, 0, 0), isNear: new Map() }
    const st = sim.current
    if (st.cam.distanceToSquared(camera.position) < RESORT_STEP * RESORT_STEP) return
    st.cam.copy(camera.position)
    const lod2 = LOD_DISTANCE * LOD_DISTANCE
    const c = camera.position

    for (const [model, list] of groups) {
      const a = near.current[model]
      const b = far.current[model]
      if (!a || !b) continue
      let changed = a.count + b.count !== list.length
      for (const p of list) {
        const dx = p.x - c.x
        const dy = p.y - c.y
        const dz = p.z - c.z
        const isNear = dx * dx + dy * dy + dz * dz < lod2
        if (st.isNear.get(p) !== isNear) {
          st.isNear.set(p, isNear)
          changed = true
        }
      }
      if (!changed) continue
      let n = 0
      let f = 0
      for (const p of list) {
        if (st.isNear.get(p)) a.setMatrixAt(n++, p.matrix)
        else b.setMatrixAt(f++, p.matrix)
      }
      a.count = n
      b.count = f
      a.instanceMatrix.needsUpdate = true
      b.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {groups.map(([model, list]) => (
        <group key={model}>
          <instancedMesh
            ref={(el) => {
              // A new mesh starts empty and forces a full re-sort.
              if (el && near.current[model] !== el) {
                el.count = 0
                sim.current = null
              }
              near.current[model] = el
            }}
            args={[pack.geometry[model], pack.material[model], list.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
          <instancedMesh
            ref={(el) => {
              // A new mesh starts empty and forces a full re-sort.
              if (el && far.current[model] !== el) {
                el.count = 0
                sim.current = null
              }
              far.current[model] = el
            }}
            args={[pack.geometry[`${model}_lod1`], pack.material[`${model}_lod1`], list.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  )
}
