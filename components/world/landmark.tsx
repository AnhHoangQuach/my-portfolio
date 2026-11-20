'use client'

import { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html, Outlines } from '@react-three/drei'
import * as THREE from 'three'

import { LANDMARKS, type LandmarkId } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { Sparkles } from './scene/sparkles'
import { SectionIcon } from './section-icon'

export interface LandmarkLabel {
  name: string
  section: string
}

const LabelsContext = createContext<Record<LandmarkId, LandmarkLabel> | null>(null)
export const LandmarkLabelsProvider = LabelsContext.Provider

const noRaycast = () => {}
const DRAG_TOLERANCE_PX = 6

/**
 * Wraps a landmark's models with everything that makes it interactive. The
 * models themselves are not raycast at all — one invisible box per landmark
 * takes the pointer, which keeps hover cheap and the hit area predictable.
 * Behaviour lives here and in the store, never in the individual models.
 */
export function Landmark({ id, children }: { id: LandmarkId; children: React.ReactNode }) {
  const cfg = LANDMARKS[id]
  const labels = useContext(LabelsContext)
  const label = labels?.[id]
  const content = useRef<THREE.Group>(null)
  const pop = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)

  const phase = useWorld((s) => s.phase)
  const hovered = useWorld((s) => s.hoveredId === id)
  const active = useWorld((s) => s.activeId === id)
  // While any landmark's panel is open, the floating markers step aside: up
  // close they'd swing across the screen with every camera move.
  const anyActive = useWorld((s) => s.activeId !== null)
  const interactive = phase === 'explore'

  useLayoutEffect(() => {
    content.current?.traverse((o) => {
      o.raycast = noRaycast
    })
  })

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const target = hovered && !active ? 1.025 : 1
    const g = pop.current
    if (g) g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 10, delta))
    const r = ring.current
    if (r) {
      const m = r.material as THREE.MeshBasicMaterial
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + cfg.position[0])
      const goal = !interactive || active ? 0 : hovered ? 0.85 : 0.22 + pulse * 0.2
      m.opacity = THREE.MathUtils.damp(m.opacity, goal, 6, delta)
      r.scale.setScalar(1 + (hovered ? 0.04 : pulse * 0.03))
      r.visible = m.opacity > 0.01
    }
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (useWorld.getState().phase !== 'explore') return
    useWorld.getState().setHovered(id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (useWorld.getState().hoveredId === id) useWorld.getState().setHovered(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // A drag that ends over a landmark is an orbit, not a click.
    if (e.delta > DRAG_TOLERANCE_PX) return
    const s = useWorld.getState()
    if (s.phase !== 'explore' || s.transitioning) return
    document.body.style.cursor = ''
    s.focus(id)
  }

  const [px, py, pz] = cfg.position
  const sparkleScale = useMemo<[number, number, number]>(
    () => [cfg.ringRadius * 1.3, 4, cfg.ringRadius * 1.3],
    [cfg.ringRadius],
  )
  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(cfg.ringRadius - 0.16, cfg.ringRadius, 72).rotateX(-Math.PI / 2),
    [cfg.ringRadius],
  )

  return (
    <group>
      <group ref={pop} position={[px, py, pz]}>
        <group ref={content} position={[-px, -py, -pz]}>
          {children}
        </group>
      </group>

      <mesh
        position={[px + cfg.hit.center[0], py + cfg.hit.center[1], pz + cfg.hit.center[2]]}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <boxGeometry args={cfg.hit.size as [number, number, number]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <mesh ref={ring} geometry={ringGeometry} position={[px, 0.07, pz]} renderOrder={2}>
        <meshBasicMaterial
          color={cfg.accent}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {interactive && (
        <Sparkles
          position={[px, py + 2.2, pz]}
          scale={sparkleScale}
          count={hovered ? 34 : 16}
          size={hovered ? 5 : 3.2}
          opacity={0.8}
          color={cfg.accent}
          seed={Math.round(px * 7 + pz * 13)}
        />
      )}

      {interactive && !anyActive && label && (
        <Html
          position={[px + cfg.markerOffset[0], py + cfg.markerOffset[1], pz + cfg.markerOffset[2]]}
          center
          zIndexRange={[20, 10]}
          className="pointer-events-none"
        >
          <button
            type="button"
            onClick={() => useWorld.getState().focus(id)}
            onPointerEnter={() => useWorld.getState().setHovered(id)}
            onPointerLeave={() => useWorld.getState().setHovered(null)}
            aria-label={`${label.name} — ${label.section}`}
            className="world-marker pointer-events-auto group flex items-center gap-1.5 whitespace-nowrap"
            data-hovered={hovered || undefined}
            style={{ '--accent': cfg.accent } as React.CSSProperties}
          >
            <span className="world-marker-icon grid size-8 place-items-center rounded-full">
              <SectionIcon section={cfg.section} className="size-4" />
            </span>
            <span className="world-marker-label rounded-full px-2.5 py-1 text-xs font-semibold">
              {label.name}
              <span className="ml-1.5 font-mono text-[10px] tracking-wider uppercase opacity-60">
                {label.section}
              </span>
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

/** Re-renders only when this landmark's hover state flips. */
export function useLandmarkHover(id: LandmarkId) {
  return useWorld((s) => s.hoveredId === id)
}

/** Soft outline drawn on a hero mesh while its landmark is hovered. */
export function HoverOutline({ id, thickness = 0.05 }: { id: LandmarkId; thickness?: number }) {
  const hovered = useLandmarkHover(id)
  if (!hovered) return null
  return <Outlines thickness={thickness} color="#FFF8EB" transparent opacity={0.95} />
}
