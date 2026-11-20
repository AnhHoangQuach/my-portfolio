'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import {
  EAST_LAND,
  MARBLE_PEAKS,
  SON_TRA_DOMES,
  WORLD,
  hillHeight,
  resample,
  rng,
  type Peak,
} from '@/lib/world/geo'
import { layout } from '@/lib/world/layout'
import { glowColor, withSurfaceDetail } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { HoverOutline, Landmark } from '../landmark'
import { Mist } from './atmosphere'
import { StaticInstances, Trees } from './instanced'

/** Deterministic pseudo-noise from a position, so shared vertices move together. */
function positionNoise(x: number, y: number, z: number, seed: number) {
  return (
    Math.sin(x * 4.1 + seed) * Math.sin(y * 3.3 + seed * 1.7) * Math.sin(z * 4.7 + seed * 0.3) * 0.6 +
    Math.sin(x * 9.3 - seed) * Math.sin(z * 8.1 + y * 2) * 0.25
  )
}

/* ------------------------------------------------------------------------ */
/* Son Tra                                                                   */
/* ------------------------------------------------------------------------ */

/** Son Tra Peninsula — SKILLS. */
export function SonTra() {
  const mist = useMemo(
    () => [
      { x: 30, y: 6.2, z: -33, s: 5 },
      { x: 24, y: 3.6, z: -38, s: 4 },
      { x: 36, y: 4, z: -30, s: 3.6 },
      { x: 31, y: 2.8, z: -42, s: 4.4 },
      { x: 39, y: 1.4, z: -37, s: 3.4 },
    ],
    [],
  )
  return (
    <Landmark id="son-tra">
      <Hills />
      <Trees items={layout.forest} sway={0.04} />
      <Cliffs />
      <LinhUngPagoda position={[21.6, 0, -24.6]} />
      <LadyBuddha position={[19.9, 0, -23.2]} />
      <Mist spots={mist} opacity={0.36} />
    </Landmark>
  )
}

function Hills() {
  const geometry = useMemo(() => {
    const parts = SON_TRA_DOMES.map((d, k) => {
      const g = new THREE.SphereGeometry(1, 20, 9, 0, Math.PI * 2, 0, Math.PI / 2)
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        const j = y > 0.02 ? 1 + positionNoise(x, y, z, k * 3.1) * 0.07 : 1
        pos.setXYZ(i, x * j * d.rx + d.x, y * j * d.h - 0.05, z * j * d.rz + d.z)
      }
      return g.toNonIndexed()
    })
    const merged = mergeGeometries(parts)!
    // Per-face colour: deeper green in the folds, lighter on sunny crests.
    const pos = merged.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    const low = new THREE.Color(palette.forest)
    const high = new THREE.Color('#86B596')
    const c = new THREE.Color()
    const r = rng(88)
    for (let i = 0; i < pos.count; i += 3) {
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3
      c.copy(low).lerp(high, Math.min(1, y / 6) * 0.7 + r() * 0.25)
      for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3)
    }
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    merged.computeVertexNormals()
    return merged
  }, [])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
      <HoverOutline id="son-tra" thickness={0.08} />
    </mesh>
  )
}

/** Rocks where the headland drops into the sea. */
function Cliffs() {
  const rocks = useMemo(() => {
    const r = rng(99)
    const shore = resample(
      EAST_LAND.filter(([x, z]) => z < -21 && x > 16.5),
      1.3,
    )
    const cx = 29
    const cz = -33
    return shore
      .filter(() => r() > 0.25)
      .map(([x, z]) => {
        const dx = x - cx
        const dz = z - cz
        const len = Math.hypot(dx, dz) || 1
        return {
          x: x + (dx / len) * 0.5,
          z: z + (dz / len) * 0.5,
          s: 0.5 + r() * 0.8,
          rot: r() * 6,
        }
      })
  }, [])
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.7, 0), [])
  const material = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#B9AC98', flatShading: true }),
    [],
  )
  const items = useMemo(
    () =>
      rocks.map((k) => ({
        position: [k.x, WORLD.waterY + k.s * 0.2, k.z] as [number, number, number],
        rotation: [k.rot, k.rot * 0.7, 0] as [number, number, number],
        scale: [k.s, k.s * 0.8, k.s] as [number, number, number],
      })),
    [rocks],
  )
  return <StaticInstances geometry={geometry} material={material} items={items} castShadow />
}

function TieredRoof({
  y,
  size,
  color,
}: {
  y: number
  size: number
  color: string
}) {
  return (
    <mesh position={[0, y, 0]} rotation-y={Math.PI / 4} castShadow>
      <coneGeometry args={[size * 0.78, size * 0.32, 4]} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

/** Linh Ung Pagoda: a hall and a seven-storey tower on a stone terrace. */
function LinhUngPagoda({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation-y={0.4}>
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.24, 3]} />
        <meshLambertMaterial color={palette.stone} />
      </mesh>
      {/* Main hall */}
      <group position={[-0.6, 0.24, 0.3]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.8, 0.7, 1.1]} />
          <meshLambertMaterial color={palette.warmWhite} />
        </mesh>
        <mesh position={[0, 0.9, 0]} scale={[1.45, 1, 0.95]} castShadow>
          <coneGeometry args={[1.05, 0.55, 4, 1]} />
          <meshLambertMaterial color={palette.pagodaRed} flatShading />
        </mesh>
        <mesh position={[0, 1.22, 0]}>
          <boxGeometry args={[1.3, 0.06, 0.06]} />
          <meshLambertMaterial color={palette.gold} />
        </mesh>
      </group>
      {/* Seven-storey tower */}
      <group position={[1.2, 0.24, -0.6]}>
        {Array.from({ length: 7 }, (_, i) => {
          const s = 0.7 - i * 0.06
          const y = i * 0.38
          return (
            <group key={i}>
              <mesh position={[0, y + 0.15, 0]} castShadow>
                <boxGeometry args={[s, 0.3, s]} />
                <meshLambertMaterial color={palette.warmWhite} />
              </mesh>
              <TieredRoof y={y + 0.34} size={s + 0.35} color={palette.pagodaRed} />
            </group>
          )
        })}
        <mesh position={[0, 2.85, 0]}>
          <coneGeometry args={[0.05, 0.4, 6]} />
          <meshLambertMaterial color={palette.gold} />
        </mesh>
      </group>
    </group>
  )
}

/** Lady Buddha (Quan The Am) — a white statue on a lotus, watching over the bay. */
function LadyBuddha({ position }: { position: [number, number, number] }) {
  const geometry = useMemo(() => {
    const profile: [number, number][] = [
      [0, 0],
      [0.55, 0],
      [0.6, 0.14],
      [0.42, 0.28],
      [0.36, 0.34],
      [0.34, 0.5],
      [0.31, 1.5],
      [0.25, 2.4],
      [0.3, 2.55],
      [0.18, 2.72],
      [0.1, 2.78],
      [0.17, 2.92],
      [0.18, 3.08],
      [0.12, 3.22],
      [0.05, 3.3],
      [0, 3.32],
    ]
    return new THREE.LatheGeometry(
      profile.map(([x, y]) => new THREE.Vector2(x, y)),
      14,
    )
  }, [])
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.95, 0.5, 8]} />
        <meshLambertMaterial color={palette.stone} flatShading />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.5, 0]} castShadow>
        <meshLambertMaterial color="#FBF8F3" emissive="#ffffff" emissiveIntensity={0.12} flatShading />
      </mesh>
      <mesh position={[0, 3.55, -0.12]}>
        <torusGeometry args={[0.3, 0.03, 6, 20]} />
        <meshBasicMaterial color={glowColor(palette.gold, 1.6)} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Marble Mountains                                                          */
/* ------------------------------------------------------------------------ */

function peakGeometry(p: Peak) {
  // Higher subdivision + welded vertices for smooth, craggy karst forms.
  // UVs and normals are dropped first: they differ across the seams and
  // would stop the vertices welding (normals are recomputed, rock is
  // textured in world space).
  const base = new THREE.IcosahedronGeometry(1, 4)
  base.deleteAttribute('uv')
  base.deleteAttribute('normal')
  const g = mergeVertices(base)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Two octaves: big buttresses plus fine crags.
    const n =
      1 + positionNoise(x, y, z, p.seed) * 0.26 + positionNoise(x * 2.7, y * 2.7, z * 2.7, p.seed + 5) * 0.08
    const t = Math.max(0, Math.min(1, (y * n + 1) / 2))
    // Karst profile: steep walls, a rounded crown.
    const taper = 1.1 - 0.62 * Math.pow(t, 1.5)
    pos.setXYZ(i, x * n * p.r * taper + p.x, t * p.h - 0.35, z * n * p.r * taper + p.z)
  }
  g.computeVertexNormals()

  // Per-vertex colour: jungle clinging to every ledge and the upper slopes,
  // pale limestone on the cliffs, darker rock in the clefts.
  const nrm = g.getAttribute('normal')
  const colors = new Float32Array(pos.count * 3)
  const stone = new THREE.Color(palette.limestone)
  const shade = new THREE.Color(palette.limestoneShade)
  const jungle = new THREE.Color('#3f5d2f')
  const moss = new THREE.Color('#5d7a3c')
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ny = nrm.getY(i)
    const v = positionNoise(x * 0.9, y * 0.9, z * 0.9, p.seed + 9) * 0.5 + 0.5
    const ledge = THREE.MathUtils.smoothstep(ny, 0.25, 0.65)
    const high = THREE.MathUtils.smoothstep(y / p.h, 0.15, 0.55)
    const green = Math.min(1, ledge * (0.55 + 0.45 * high) + (v > 0.62 ? 0.35 : 0))
    c.copy(stone).lerp(shade, Math.max(0, 0.6 - ny) * 0.9 + v * 0.2)
    c.lerp(v > 0.5 ? jungle : moss, green)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

/** Marble Mountains (Ngu Hanh Son) — EXPERIENCE. */
export function MarbleMountains() {
  const geometry = useMemo(() => mergeGeometries(MARBLE_PEAKS.map(peakGeometry))!, [])
  const limestone = useMemo(
    () =>
      withSurfaceDetail(
        new THREE.MeshLambertMaterial({ vertexColors: true }),
        'limestone',
      ),
    [],
  )
  const stoneGeometry = useMemo(() => new THREE.CylinderGeometry(0.2, 0.22, 0.06, 7), [])
  const stoneMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: palette.limestoneShade }),
    [],
  )
  const stones = useMemo(() => {
    const r = rng(31)
    return resample(
      [
        [10, 31.4],
        [10.6, 33.4],
        [12.2, 35.2],
        [13.4, 37.6],
      ],
      0.55,
    ).map(([x, z]) => {
      const s = 0.8 + r() * 0.4
      return {
        position: [x + (r() - 0.5) * 0.2, 0.04, z] as [number, number, number],
        scale: [s, 1, s] as [number, number, number],
      }
    })
  }, [])
  const mist = useMemo(
    () =>
      MARBLE_PEAKS.map((p, i) => ({ x: p.x + 0.6, y: p.h * (0.45 + (i % 2) * 0.15), z: p.z + 0.8, s: p.r * 1.5 })),
    [],
  )
  const top = MARBLE_PEAKS[0]

  return (
    <Landmark id="marble-mountains">
      <mesh geometry={geometry} material={limestone} castShadow receiveShadow>
        <HoverOutline id="marble-mountains" thickness={0.07} />
      </mesh>
      <StaticInstances
        geometry={stoneGeometry}
        material={stoneMaterial}
        items={stones}
        receiveShadow
      />
      <TempleGate position={[10, 0, 31.1]} />
      {/* A tiny pagoda roof peeking out of the summit greenery. */}
      <group position={[top.x - 0.3, top.h * 0.86, top.z + 0.2]}>
        <TieredRoof y={0} size={0.7} color={palette.pagodaRed} />
        <TieredRoof y={0.2} size={0.5} color={palette.pagodaRed} />
      </group>
      <Mist spots={mist} opacity={0.3} />
    </Landmark>
  )
}

function TempleGate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 1.1, 8]} />
          <meshLambertMaterial color={palette.pagodaRed} />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.3]} />
        <meshLambertMaterial color={palette.gold} />
      </mesh>
      <mesh position={[0, 1.32, 0]} scale={[1.7, 1, 0.55]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[0.72, 0.36, 4]} />
        <meshLambertMaterial color={palette.pagodaRed} flatShading />
      </mesh>
      <mesh position={[0, 1.58, 0]} scale={[1.2, 1, 0.45]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[0.55, 0.3, 4]} />
        <meshLambertMaterial color={palette.pagodaRed} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.03 + i * 0.05, 0.3 + i * 0.2]} receiveShadow>
          <boxGeometry args={[1.3 - i * 0.15, 0.06 + i * 0.1, 0.24]} />
          <meshLambertMaterial color={palette.limestone} />
        </mesh>
      ))}
    </group>
  )
}

export { hillHeight }
