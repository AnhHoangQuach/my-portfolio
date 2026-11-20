'use client'

import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'

import { EAST_LAND, WEST_LAND, WORLD, shapeFromXZ } from '@/lib/world/geo'
import { createGroundMaterial, createWaterMaterial } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'

/**
 * The diorama itself: a round earthen platter, a cut-away layer of sea, and
 * the two banks of the Han River extruded as chunky slabs. The river is the
 * gap between the slabs, so its banks read as real embankments.
 */
export function Terrain() {
  return (
    <group>
      <Platter />
      <Water />
      <LandSlab poly={WEST_LAND} />
      <LandSlab poly={EAST_LAND} />
    </group>
  )
}

function Platter() {
  const R = WORLD.radius
  return (
    <group>
      {/* Cut-away water column, visible from the side of the platter. */}
      <mesh position={[0, (WORLD.waterY + WORLD.seabedY) / 2, 0]}>
        <cylinderGeometry args={[R, R, WORLD.waterY - WORLD.seabedY, 96, 1, true]} />
        <meshLambertMaterial
          color={palette.turquoise}
          transparent
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Seabed sand layer. */}
      <mesh position={[0, WORLD.seabedY - 0.35, 0]} receiveShadow>
        <cylinderGeometry args={[R, R, 0.7, 96]} />
        <meshLambertMaterial color={palette.sand} />
      </mesh>
      {/* Earth and the wooden base of the diorama. */}
      <mesh position={[0, WORLD.seabedY - 2.1, 0]}>
        <cylinderGeometry args={[R + 0.1, R - 0.6, 2.8, 96]} />
        <meshLambertMaterial color={palette.wood} />
      </mesh>
      <mesh position={[0, WORLD.seabedY - 3.7, 0]}>
        <cylinderGeometry args={[R - 0.6, R - 1.6, 0.4, 96]} />
        <meshLambertMaterial color={palette.woodDark} />
      </mesh>
    </group>
  )
}

function Water() {
  const material = useMemo(() => createWaterMaterial(), [])
  const R = WORLD.radius
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={WORLD.waterY} material={material}>
      <planeGeometry args={[R * 2, R * 2, 140, 140]} />
    </mesh>
  )
}

function LandSlab({ poly }: { poly: typeof WEST_LAND }) {
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
    () => [createGroundMaterial(), new THREE.MeshLambertMaterial({ color: palette.stone })],
    [],
  )

  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={materials} receiveShadow />
}
