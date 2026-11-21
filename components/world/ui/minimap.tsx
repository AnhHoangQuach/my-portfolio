'use client'

import { useEffect, useMemo, useRef } from 'react'

import { car, cameraProbe } from '@/lib/world/drive'
import { EAST_LAND, MARBLE_PEAKS, SON_TRA_DOMES, WEST_LAND, type XZ } from '@/lib/world/geo'
import { roads } from '@/lib/world/layout'
import { LANDMARKS, LANDMARK_ORDER } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { SectionIcon } from '../section-icon'
import type { WorldStrings } from '../strings'

/** The part of the world the map shows, in world units (x east, z south). */
const VIEW = { x: -62, z: -50, w: 112, h: 98 } as const
const INSET = 3

const path = (pts: readonly XZ[], close = false) =>
  pts.map(([x, z], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${z.toFixed(1)}`).join('') + (close ? 'Z' : '')

const pct = (v: number, from: number, size: number) => `${((v - from) / size) * 100}%`

/**
 * Corner map of the city, drawn from the same geography as the scene: land,
 * river, streets, hills and the six landmarks (click one to fly there). The
 * marker shows the camera and its view direction, or the car while driving;
 * it is moved by a rAF loop writing the SVG transform, never React state.
 * Its own chunk, loaded once the scene is up.
 */
export default function Minimap({ strings }: { strings: WorldStrings }) {
  const focus = useWorld((s) => s.focus)
  const marker = useRef<SVGGElement>(null)
  const cone = useRef<SVGPathElement>(null)
  const arrow = useRef<SVGPathElement>(null)

  const shapes = useMemo(
    () => ({
      land: [path(WEST_LAND, true), path(EAST_LAND, true)],
      roads: roads.filter((r) => r.kind === 'road').map((r) => ({ d: path(r.line), w: r.width })),
    }),
    [],
  )

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const g = marker.current
      const riding = useWorld.getState().ride !== 'off'
      const src = riding ? { x: car.x, z: car.z, yaw: car.heading } : cameraProbe
      if (g && (riding || cameraProbe.ready)) {
        // Off the map (the overview shot sits well south): pin to the edge.
        const x = Math.min(VIEW.x + VIEW.w - INSET, Math.max(VIEW.x + INSET, src.x))
        const z = Math.min(VIEW.z + VIEW.h - INSET, Math.max(VIEW.z + INSET, src.z))
        g.setAttribute('transform', `translate(${x.toFixed(2)} ${z.toFixed(2)}) rotate(${((src.yaw * 180) / Math.PI).toFixed(1)})`)
        g.style.opacity = '1'
        if (cone.current) cone.current.style.display = riding ? 'none' : ''
        if (arrow.current) arrow.current.style.display = riding ? '' : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <nav
      aria-label={strings.map.label}
      className="world-card absolute top-21 left-3 z-30 hidden w-52 overflow-hidden rounded-2xl! p-1 sm:left-4 md:block"
    >
      <div className="relative" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.z} ${VIEW.w} ${VIEW.h}`}
          className="world-map absolute inset-0 size-full rounded-xl"
          aria-hidden
        >
          <rect x={VIEW.x} y={VIEW.z} width={VIEW.w} height={VIEW.h} className="world-map-water" />
          {shapes.land.map((d, i) => (
            <path key={i} d={d} className="world-map-land" />
          ))}
          {SON_TRA_DOMES.map((d, i) => (
            <ellipse key={i} cx={d.x} cy={d.z} rx={d.rx * 0.85} ry={d.rz * 0.85} className="world-map-hill" />
          ))}
          {MARBLE_PEAKS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.z} r={p.r} className="world-map-rock" />
          ))}
          {shapes.roads.map((r, i) => (
            <path key={i} d={r.d} strokeWidth={r.w} className="world-map-road" />
          ))}
          <g ref={marker} style={{ opacity: 0 }}>
            <title>{strings.map.you}</title>
            <path ref={cone} d="M0 0 L16 -8 Q18 0 16 8 Z" className="world-map-cone" />
            <path ref={arrow} d="M4 0 L-3 -3 L-1.5 0 L-3 3 Z" className="world-map-car" style={{ display: 'none' }} />
            <circle r={1.6} className="world-map-you" />
          </g>
        </svg>

        {LANDMARK_ORDER.map((id) => {
          const cfg = LANDMARKS[id]
          const s = strings.landmarks[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => focus(id)}
              aria-label={`${s.section} — ${s.name}`}
              title={`${s.section} — ${s.name}`}
              className="world-btn absolute grid size-6 -translate-1/2 place-items-center rounded-full! bg-(--w-paper) hover:scale-110"
              style={{
                left: pct(cfg.position[0], VIEW.x, VIEW.w),
                top: pct(cfg.position[2], VIEW.z, VIEW.h),
                color: cfg.accent,
                border: `2px solid ${cfg.accent}`,
              }}
            >
              <SectionIcon section={cfg.section} className="size-3" />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
