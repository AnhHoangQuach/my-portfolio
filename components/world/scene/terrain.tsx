'use client'

import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'

import {
  EAST_LAND,
  FAR,
  WEST_LAND,
  WORLD,
  farTerrainHeight,
  pointInPolygon,
  shapeFromXZ,
} from '@/lib/world/geo'
import { createGroundMaterial, createWaterMaterial } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'

/**
 * The land and sea, out to the horizon: the two banks of the Han River as
 * extruded slabs (so the river and coasts have real embankments), an open sea
 * plane, and a height field for the distant hills and mountains.
 */
export function Terrain() {
  const ground = useMemo(() => createGroundMaterial(), [])
  return (
    <group>
      <Water />
      <LandSlab poly={WEST_LAND} ground={ground} />
      <LandSlab poly={EAST_LAND} ground={ground} />
      <FarTerrain ground={ground} />
    </group>
  )
}

function Water() {
  const material = useMemo(() => createWaterMaterial(), [])
  const size = FAR * 2 + 600
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={WORLD.waterY} material={material}>
      <planeGeometry args={[size, size, 220, 220]} />
    </mesh>
  )
}

function LandSlab({ poly, ground }: { poly: typeof WEST_LAND; ground: THREE.Material }) {
  const geometry = useMemo(() => {
    const depth = -WORLD.seabedY - 0.25
    const g = new THREE.ExtrudeGeometry(shapeFromXZ(poly), {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.3,
      bevelSegments: 2,
      curveSegments: 4,
    })
    g.rotateX(-Math.PI / 2)
    g.translate(0, WORLD.seabedY, 0)
    return g
  }, [poly])

  const materials = useMemo(
    () => [ground, new THREE.MeshLambertMaterial({ color: palette.stone })],
    [ground],
  )

  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={materials} receiveShadow />
}

/**
 * Distant countryside and mountains. The grid sits 0.35 below the land slab,
 * so where the ground is flat the slab hides it and only hills rise through;
 * off the coast it drops under the sea, giving the Hai Van massif real cliffs.
 */
function FarTerrain({ ground }: { ground: THREE.Material }) {
  const geometry = useMemo(() => {
    const size = FAR * 2
    const segments = 176
    const g = new THREE.PlaneGeometry(size, size, segments, segments)
    g.rotateX(-Math.PI / 2)
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      // Around the city the hills are flat, so the grid is hidden either way
      // (under the land slab or under the sea): skip the polygon tests there.
      const h = farTerrainHeight(x, z)
      if (h <= 0) {
        pos.setY(i, -6)
        continue
      }
      const onLand = pointInPolygon(x, z, WEST_LAND) || pointInPolygon(x, z, EAST_LAND)
      pos.setY(i, onLand ? h - 0.35 : -6)
    }
    g.computeVertexNormals()
    return g
  }, [])

  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={ground} receiveShadow />
}

