'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import type { Building, TreeInstance } from '@/lib/world/layout'
import { createBuildingMaterial, createSwayMaterial, withSurfaceDetail } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { useWorld } from '@/lib/world/store'
import { KitBuildings } from './kit-buildings'
import { usePack } from './models'

/* ------------------------------------------------------------------------ */
/* Shared geometry                                                           */
/* ------------------------------------------------------------------------ */

const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0)

/** Four-sided pyramid, base 1×1, height 1, sitting on y = 0. */
const hipRoof = (() => {
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1)
  g.rotateY(Math.PI / 4)
  g.translate(0, 0.5, 0)
  return g
})()

/** Triangular prism with the ridge along X, base 1×1, height 1. */
const gableRoof = (() => {
  const shape = new THREE.Shape()
  shape.moveTo(-0.5, 0)
  shape.lineTo(0.5, 0)
  shape.lineTo(0, 1)
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false })
  g.translate(0, 0, -0.5)
  g.rotateY(Math.PI / 2)
  return g
})()

export const treeGeometry = (() => {
  const blobA = new THREE.IcosahedronGeometry(0.78, 1)
  blobA.scale(1, 0.9, 1)
  blobA.translate(0, 1.3, 0)
  const blobB = new THREE.IcosahedronGeometry(0.5, 1)
  blobB.translate(0.22, 1.86, 0.08)
  return mergeGeometries([blobA, blobB])!
})()

export const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.13, 1, 6).translate(0, 0.5, 0)

/* ------------------------------------------------------------------------ */
/* Buildings                                                                 */
/* ------------------------------------------------------------------------ */

function useInstances(
  ref: React.RefObject<THREE.InstancedMesh | null>,
  count: number,
  fill: (i: number, dummy: THREE.Object3D, color: THREE.Color) => void,
) {
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      fill(i, dummy, color)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [ref, count, fill])
}

/**
 * A list of buildings: glTF kit models on the high tier (see
 * `kit-buildings.tsx`), procedural shader-drawn blocks on the low tier.
 */
export function Buildings({ items }: { items: Building[] }) {
  const high = useWorld((s) => s.quality === 'high')
  const pack = usePack('buildings', high)
  return pack ? <KitBuildings items={items} pack={pack} /> : <ProceduralBuildings items={items} />
}

/** Walls, roofs and rooftop clutter for a list of buildings: four draw calls total. */
function ProceduralBuildings({ items }: { items: Building[] }) {
  const wallMaterial = useMemo(() => withSurfaceDetail(createBuildingMaterial(), 'plaster'), [])
  const roofMaterial = useMemo(
    () =>
      withSurfaceDetail(new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), 'roof'),
    [],
  )

  const flat = useMemo(() => items.filter((b) => b.roofKind === 'flat'), [items])
  const hip = useMemo(() => items.filter((b) => b.roofKind === 'hip'), [items])
  const gable = useMemo(() => items.filter((b) => b.roofKind === 'gable'), [items])
  // Rooftop clutter: water tanks on houses (very Da Nang), plant rooms on the rest.
  const tanks = useMemo(() => flat.filter((b) => b.kind === 'house'), [flat])
  const plant = useMemo(() => flat.filter((b) => b.kind !== 'house'), [flat])

  const walls = useRef<THREE.InstancedMesh>(null)
  const flatRef = useRef<THREE.InstancedMesh>(null)
  const hipRef = useRef<THREE.InstancedMesh>(null)
  const gableRef = useRef<THREE.InstancedMesh>(null)
  const tankRef = useRef<THREE.InstancedMesh>(null)
  const plantRef = useRef<THREE.InstancedMesh>(null)

  useInstances(
    walls,
    items.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = items[i]
        d.position.set(b.x, 0, b.z)
        d.rotation.y = b.rot
        d.scale.set(b.w, b.h, b.d)
        c.set(b.wall)
      },
      [items],
    ),
  )
  useInstances(
    flatRef,
    flat.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = flat[i]
        d.position.set(b.x, b.h, b.z)
        d.rotation.y = b.rot
        d.scale.set(b.w + 0.12, 0.14, b.d + 0.12)
        c.set(b.roof)
      },
      [flat],
    ),
  )
  useInstances(
    hipRef,
    hip.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = hip[i]
        d.position.set(b.x, b.h, b.z)
        d.rotation.y = b.rot
        d.scale.set(b.w + 0.22, 0.5 + b.w * 0.18, b.d + 0.22)
        c.set(b.roof)
      },
      [hip],
    ),
  )
  useInstances(
    gableRef,
    gable.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = gable[i]
        d.position.set(b.x, b.h, b.z)
        d.rotation.y = b.rot
        d.scale.set(b.w + 0.2, 0.55, b.d + 0.2)
        c.set(b.roof)
      },
      [gable],
    ),
  )
  useInstances(
    tankRef,
    tanks.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = tanks[i]
        const k = (b.x * 7.3 + b.z * 3.1) % 1
        d.position.set(b.x + b.w * 0.22, b.h + 0.14, b.z - b.d * 0.3)
        d.rotation.set(0, 0, 0)
        d.scale.set(0.085, 0.17, 0.085)
        c.set(Math.abs(k) < 0.7 ? '#c9cdd0' : '#2f6fb3')
      },
      [tanks],
    ),
  )
  useInstances(
    plantRef,
    plant.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const b = plant[i]
        d.position.set(b.x + b.w * 0.12, b.h + 0.14, b.z - b.d * 0.1)
        d.scale.set(b.w * 0.42, b.kind === 'tower' ? 0.36 : 0.22, b.d * 0.38)
        c.set('#9a968d')
      },
      [plant],
    ),
  )

  return (
    <group>
      <instancedMesh
        ref={walls}
        args={[unitBox, wallMaterial, items.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh ref={flatRef} args={[unitBox, roofMaterial, flat.length]} castShadow />
      <instancedMesh ref={hipRef} args={[hipRoof, roofMaterial, hip.length]} castShadow />
      <instancedMesh ref={gableRef} args={[gableRoof, roofMaterial, gable.length]} castShadow />
      <instancedMesh ref={tankRef} args={[unitCylinder, roofMaterial, tanks.length]} castShadow />
      <instancedMesh ref={plantRef} args={[unitBox, roofMaterial, plant.length]} castShadow />
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Trees                                                                     */
/* ------------------------------------------------------------------------ */

/** Rounded two-blob trees on a shared sway shader: two draw calls per forest. */
export function Trees({ items, sway = 0.05 }: { items: TreeInstance[]; sway?: number }) {
  const canopyMaterial = useMemo(() => createSwayMaterial('#ffffff', sway), [sway])
  const trunkMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: palette.wood, flatShading: true }),
    [],
  )
  const canopy = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)

  useInstances(
    canopy,
    items.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const t = items[i]
        d.position.set(t.x, t.y, t.z)
        d.rotation.y = (t.x * 13.7 + t.z * 7.1) % (Math.PI * 2)
        d.scale.setScalar(t.s)
        c.set(t.color)
      },
      [items],
    ),
  )
  useInstances(
    trunks,
    items.length,
    useMemo(
      () => (i: number, d: THREE.Object3D, c: THREE.Color) => {
        const t = items[i]
        d.position.set(t.x, t.y, t.z)
        d.scale.set(t.s, t.s * 0.95, t.s)
        c.set('#ffffff')
      },
      [items],
    ),
  )

  return (
    <group>
      <instancedMesh
        ref={canopy}
        args={[treeGeometry, canopyMaterial, items.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh ref={trunks} args={[trunkGeometry, trunkMaterial, items.length]} castShadow />
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Static props                                                              */
/* ------------------------------------------------------------------------ */

export interface PropTransform {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}

/** Many copies of one small prop in a single draw call. */
export function StaticInstances({
  geometry,
  material,
  items,
  castShadow = false,
  receiveShadow = false,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  items: PropTransform[]
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new THREE.Object3D()
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(...(it.rotation ?? [0, 0, 0]))
      const s = it.scale ?? 1
      if (typeof s === 'number') d.scale.setScalar(s)
      else d.scale.set(...s)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}
