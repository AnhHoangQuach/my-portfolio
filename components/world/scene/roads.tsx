'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { hillHeight, ribbonGeometry, resample, type XZ } from '@/lib/world/geo'
import { blockOnLand, layout, roads } from '@/lib/world/layout'
import { palette } from '@/lib/world/palette'

/** Son Tra's winding road: from the coastal road, past the pagoda, over the hills. */
export const SON_TRA_ROAD: XZ[] = resample(
  [
    [19.6, -14],
    [18.4, -19],
    [19.2, -23],
    [22.8, -27.6],
    [25.6, -28.6],
    [27.5, -27.4],
    [31, -28.2],
    [33.6, -31],
    [33, -34.6],
    [29.8, -36.4],
    [26.6, -35.2],
    [26.2, -32.4],
    [28.6, -31.6],
  ],
  0.5,
)

/**
 * All roads, promenades and paved block plinths, merged into one mesh per
 * surface so the street network costs three draw calls.
 */
export function Roads() {
  const { asphalt, promenade, plinths, parks, mountain } = useMemo(() => {
    const flat = () => 0.03
    const road = roads
      .filter((r) => r.kind === 'road')
      .map((r, i) => ribbonGeometry(r.line, r.width, () => 0.03 + (i % 3) * 0.002))
    const walk = roads
      .filter((r) => r.kind === 'promenade')
      .map((r) => ribbonGeometry(r.line, r.width, flat))

    const pads = layout.blocks.filter(blockOnLand).map((b) => {
      const g = new THREE.BoxGeometry(b.x1 - b.x0, 0.06, b.z1 - b.z0)
      g.translate((b.x0 + b.x1) / 2, 0.03, (b.z0 + b.z1) / 2)
      return g.toNonIndexed()
    })
    const greens = layout.parks.map((b) => {
      const g = new THREE.BoxGeometry(b.x1 - b.x0, 0.05, b.z1 - b.z0)
      g.translate((b.x0 + b.x1) / 2, 0.025, (b.z0 + b.z1) / 2)
      return g.toNonIndexed()
    })

    const strip = (g: THREE.BufferGeometry[]) =>
      g.length ? mergeGeometries(g.map((x) => (x.index ? x.toNonIndexed() : x))) : null

    return {
      asphalt: strip(road),
      promenade: strip(walk),
      plinths: strip(pads),
      parks: strip(greens),
      mountain: ribbonGeometry(SON_TRA_ROAD, 0.7, (x, z) => hillHeight(x, z) + 0.06),
    }
  }, [])

  return (
    <group>
      {asphalt && (
        <mesh geometry={asphalt} receiveShadow>
          <meshLambertMaterial color={palette.road} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
      {promenade && (
        <mesh geometry={promenade} receiveShadow>
          <meshLambertMaterial color={palette.sand} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
      {plinths && (
        <mesh geometry={plinths} receiveShadow>
          <meshLambertMaterial color={palette.stone} />
        </mesh>
      )}
      {parks && (
        <mesh geometry={parks} receiveShadow>
          <meshLambertMaterial color={palette.grassLight} />
        </mesh>
      )}
      <mesh geometry={mountain} receiveShadow>
        <meshLambertMaterial color={palette.road} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}
