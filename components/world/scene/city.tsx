'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { layout } from '@/lib/world/layout'
import { createBuildingMaterial, glowColor, withSurfaceDetail } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { HoverOutline, Landmark } from '../landmark'
import { Buildings, Trees } from './instanced'

/** City centre (Hai Chau) — ABOUT ME. */
export function CityCenter() {
  return (
    <Landmark id="city-center">
      <Buildings items={layout.cityBuildings} />
      <AdministrativeTower position={[-7.4, 0, -10]} />
    </Landmark>
  )
}

/** Everything on the east bank that isn't a landmark of its own. */
export function EastBank() {
  return <Buildings items={layout.eastBuildings} />
}

/** Suburbs and villages out toward the horizon. */
export function Outskirts() {
  return <Buildings items={layout.outskirtBuildings} />
}

export function Greenery() {
  return <Trees items={layout.trees} />
}

/**
 * A stylised Da Nang Administrative Centre — the tall, ribbed tower that
 * anchors the skyline by the river.
 */
function AdministrativeTower({ position }: { position: [number, number, number] }) {
  const glass = useMemo(() => {
    const m = withSurfaceDetail(createBuildingMaterial(), 'plaster')
    m.color.set('#DCEAF0')
    return m
  }, [])
  const beacon = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.opacity = 0.35 + 0.65 * (Math.sin(clock.elapsedTime * 3) > 0.6 ? 1 : 0)
  })

  return (
    <group position={position}>
      {/* Podium */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1, 3.2]} />
        <meshLambertMaterial color={palette.warmWhite} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[4.2, 0.1, 3.4]} />
        <meshLambertMaterial color={palette.roofs[2]} />
      </mesh>
      {/* Tower shaft, tapering in three stages */}
      <mesh position={[0, 5.5, 0]} material={glass} castShadow>
        <cylinderGeometry args={[1.18, 1.38, 9, 8]} />
        <HoverOutline id="city-center" thickness={0.06} />
      </mesh>
      <mesh position={[0, 11.3, 0]} material={glass} castShadow>
        <cylinderGeometry args={[0.9, 1.18, 2.6, 8]} />
      </mesh>
      {/* Vertical ribs */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.3, 6.3, Math.sin(a) * 1.3]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, 10.6, 0.12]} />
            <meshLambertMaterial color={palette.warmWhite} />
          </mesh>
        )
      })}
      {/* Crown and spire */}
      <mesh position={[0, 13.1, 0]} castShadow>
        <coneGeometry args={[0.95, 1.2, 8]} />
        <meshLambertMaterial color={palette.roofs[2]} flatShading />
      </mesh>
      <mesh position={[0, 14.6, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 2, 6]} />
        <meshLambertMaterial color={palette.stone} />
      </mesh>
      <mesh position={[0, 15.65, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshBasicMaterial ref={beacon} color={glowColor('#FF6B5B')} transparent />
      </mesh>
    </group>
  )
}
