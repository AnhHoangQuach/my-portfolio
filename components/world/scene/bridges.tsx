'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { WORLD, riverAtZ } from '@/lib/world/geo'
import { BRIDGES, riverRoadX } from '@/lib/world/layout'
import { glowColor } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { HoverOutline, Landmark } from '../landmark'

export const DECK_TOP = 0.16

/* ------------------------------------------------------------------------ */
/* Love Bridge                                                               */
/* ------------------------------------------------------------------------ */

export const LOVE_BRIDGE_Z = -7.2

function heartShape(size: number) {
  const s = new THREE.Shape()
  const k = size / 16
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3 * k
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  return s
}

/** Love Lock Bridge (Cau Tinh Yeu) — a lantern-lit pier on the east bank. CONTACT. */
export function LoveBridge() {
  return (
    <Landmark id="love-bridge">
      <LoveBridgeModel />
    </Landmark>
  )
}

function LoveBridgeModel() {
  const z = LOVE_BRIDGE_Z
  const xLand = riverRoadX('east', z) - 0.9
  const xEnd = riverAtZ(z).x + 0.6
  const length = xLand - xEnd
  const cx = (xLand + xEnd) / 2

  const heartGeometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(heartShape(0.22), {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelSegments: 1,
      }).center(),
    [],
  )
  const archGeometry = useMemo(() => {
    const pts = heartShape(1.15)
      .getPoints(64)
      .map((p) => new THREE.Vector3(0, p.y, p.x))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.05, 6, true)
  }, [])

  const heartMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: palette.heart,
        emissive: palette.heart,
        emissiveIntensity: 0.45,
      }),
    [],
  )
  const lanternMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: glowColor(palette.lantern) }),
    [],
  )

  const glow = useRef<THREE.PointLight>(null)
  const arch = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // The heart material is shared, so pulsing it through one mesh pulses all hearts.
    const m = arch.current?.material as THREE.MeshLambertMaterial | undefined
    if (m) m.emissiveIntensity = 0.4 + 0.25 * Math.sin(t * 2.4)
    if (glow.current) glow.current.intensity = 5 + Math.sin(t * 2.4) * 1.2
  })

  const posts = Math.max(3, Math.round(length / 0.75))

  return (
    <group>
      {/* Wooden deck on stilts */}
      <mesh position={[cx, DECK_TOP - 0.07, z]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.14, 1.25]} />
        <meshLambertMaterial color={palette.wood} />
        <HoverOutline id="love-bridge" thickness={0.04} />
      </mesh>
      {Array.from({ length: posts }, (_, i) => {
        const x = THREE.MathUtils.lerp(xLand - 0.3, xEnd + 0.2, i / (posts - 1))
        return (
          <group key={i}>
            <mesh position={[x, (DECK_TOP + WORLD.seabedY) / 2, z]}>
              <boxGeometry args={[0.14, DECK_TOP - WORLD.seabedY, 1.05]} />
              <meshLambertMaterial color={palette.woodDark} />
            </mesh>
            {[-0.58, 0.58].map((dz) => (
              <group key={dz} position={[x, DECK_TOP, z + dz]}>
                <mesh position={[0, 0.3, 0]}>
                  <boxGeometry args={[0.06, 0.6, 0.06]} />
                  <meshLambertMaterial color={palette.woodDark} />
                </mesh>
                <mesh position={[0, 0.72, 0]} material={heartMaterial} geometry={heartGeometry} rotation-y={Math.PI / 2} />
              </group>
            ))}
          </group>
        )
      })}
      {/* Handrails */}
      {[-0.58, 0.58].map((dz) => (
        <mesh key={dz} position={[cx, DECK_TOP + 0.52, z + dz]}>
          <boxGeometry args={[length, 0.05, 0.05]} />
          <meshLambertMaterial color={palette.warmWhite} />
        </mesh>
      ))}
      {/* Heart arch at the landing */}
      <mesh
        ref={arch}
        geometry={archGeometry}
        material={heartMaterial}
        position={[xLand - 0.2, DECK_TOP + 1.25, z]}
      />
      {/* Overhead lantern string */}
      {Array.from({ length: 6 }, (_, i) => {
        const u = (i + 0.5) / 6
        const x = THREE.MathUtils.lerp(xLand - 0.5, xEnd + 0.3, u)
        const sag = Math.sin(u * Math.PI) * 0.18
        return (
          <mesh key={i} position={[x, DECK_TOP + 1.35 - sag, z]} material={lanternMaterial}>
            <cylinderGeometry args={[0.07, 0.09, 0.16, 8]} />
          </mesh>
        )
      })}
      <mesh position={[cx, DECK_TOP + 1.42, z]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.008, 0.008, length, 3]} />
        <meshBasicMaterial color={palette.woodDark} />
      </mesh>
      {/* Carp-dragon statue at the end of the pier */}
      <CarpDragon position={[xEnd + 0.15, DECK_TOP, z]} />
      <pointLight
        ref={glow}
        position={[cx, DECK_TOP + 1.2, z]}
        color="#FFB38A"
        intensity={5}
        distance={7}
        decay={1.8}
      />
    </group>
  )
}

function CarpDragon({ position }: { position: [number, number, number] }) {
  const body = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(-0.15, 0.7, 0),
      new THREE.Vector3(0.05, 1.15, 0),
      new THREE.Vector3(0.3, 1.35, 0),
    ])
    return new THREE.TubeGeometry(curve, 24, 0.13, 8, false)
  }, [])
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.24, 10]} />
        <meshLambertMaterial color={palette.stone} />
      </mesh>
      <mesh geometry={body} castShadow>
        <meshLambertMaterial color="#F8F4EE" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0.36, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshLambertMaterial color="#F8F4EE" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[-0.05, 0.28, 0]} rotation-z={0.6}>
        <coneGeometry args={[0.18, 0.3, 4]} />
        <meshLambertMaterial color="#F8F4EE" />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Han River Bridge & Tran Thi Ly Bridge                                     */
/* ------------------------------------------------------------------------ */

function Deck({ z, x0, x1 }: { z: number; x0: number; x1: number }) {
  const cx = (x0 + x1) / 2
  const len = x1 - x0
  return (
    <group>
      <mesh position={[cx, DECK_TOP - 0.11, z]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.22, 1.9]} />
        <meshLambertMaterial color={palette.stone} />
      </mesh>
      <mesh position={[cx, DECK_TOP + 0.005, z]}>
        <boxGeometry args={[len, 0.01, 1.5]} />
        <meshLambertMaterial color={palette.road} />
      </mesh>
      {[0.3, 0.7].map((u) => (
        <mesh key={u} position={[THREE.MathUtils.lerp(x0, x1, u), (DECK_TOP + WORLD.seabedY) / 2, z]}>
          <boxGeometry args={[0.35, DECK_TOP - WORLD.seabedY, 1.5]} />
          <meshLambertMaterial color={palette.stone} />
        </mesh>
      ))}
    </group>
  )
}

/** The swing bridge to the north, with its twin truss arches. */
export function HanRiverBridge() {
  const z = BRIDGES.hanRiver
  const x0 = riverRoadX('west', z) - 0.3
  const x1 = riverRoadX('east', z) + 0.3
  const arch = useMemo(() => {
    const pts = Array.from({ length: 17 }, (_, i) => {
      const u = i / 16
      return new THREE.Vector3(THREE.MathUtils.lerp(-1, 1, u), Math.sin(u * Math.PI), 0)
    })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.05, 5)
  }, [])
  const span = (x1 - x0) * 0.42
  return (
    <group>
      <Deck z={z} x0={x0} x1={x1} />
      {[-0.95, 0.95].map((dz) => (
        <mesh
          key={dz}
          geometry={arch}
          position={[(x0 + x1) / 2, DECK_TOP, z + dz]}
          scale={[span, 1.2, 1]}
        >
          <meshLambertMaterial color="#8FB9D0" />
        </mesh>
      ))}
    </group>
  )
}

/** Tran Thi Ly: a cable-stayed span hung from a single leaning pylon. */
export function TranThiLyBridge() {
  const z = BRIDGES.tranThiLy
  const x0 = riverRoadX('west', z) - 0.3
  const x1 = riverRoadX('east', z) + 0.3
  const px = THREE.MathUtils.lerp(x0, x1, 0.32)
  const top = new THREE.Vector3(px - 0.9, DECK_TOP + 4.4, z)
  const cables = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 7; i++) {
      const x = THREE.MathUtils.lerp(px + 0.4, x1 - 0.4, i / 7)
      for (const dz of [-0.7, 0.7]) pts.push(top.x, top.y - i * 0.18, z, x, DECK_TOP + 0.05, z + dz)
    }
    for (let i = 1; i <= 3; i++) {
      const x = THREE.MathUtils.lerp(px - 0.5, x0 + 0.4, i / 3)
      pts.push(top.x, top.y - i * 0.3, z, x, DECK_TOP + 0.05, z)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [px, x0, x1, z, top.x, top.y])

  return (
    <group>
      <Deck z={z} x0={x0} x1={x1} />
      <mesh position={[(px + top.x) / 2, (DECK_TOP + top.y) / 2, z]} rotation-z={0.2} castShadow>
        <boxGeometry args={[0.32, top.y - DECK_TOP + 0.4, 0.42]} />
        <meshLambertMaterial color={palette.warmWhite} />
      </mesh>
      <lineSegments geometry={cables}>
        <lineBasicMaterial color="#B8C4C8" />
      </lineSegments>
    </group>
  )
}
