'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut } from 'lucide-react'

import { KMH, RIDE, car, landmarkNear, resetRideInput, rideInput } from '@/lib/world/drive'
import { LANDMARKS, type LandmarkId } from '@/lib/world/landmarks'
import { useWorld } from '@/lib/world/store'
import { SectionIcon } from '../section-icon'
import type { WorldStrings } from '../strings'
import { TimedHint } from './timed-hint'

/** Held keys → ride controls. Arrow keys ride here instead of travelling the journey. */
const KEYS: Record<string, keyof typeof rideInput> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'brake',
}

const isTyping = (t: EventTarget | null) =>
  !!(t as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')

/**
 * Ride mode overlay: keyboard and touch controls, speedometer, the "open this
 * landmark" prompt and the way out of the car. Its own chunk, loaded with the
 * ride (it shares the scene's geography modules).
 */
export default function RideHud({ strings }: { strings: WorldStrings }) {
  const [near, setNear] = useState<LandmarkId | null>(null)
  const nearRef = useRef<LandmarkId | null>(null)
  const speedText = useRef<HTMLSpanElement>(null)
  const speedBar = useRef<HTMLSpanElement>(null)
  const focus = useWorld((s) => s.focus)
  const stopRide = useWorld((s) => s.stopRide)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return
      const k = KEYS[e.code]
      if (k) {
        rideInput[k] = true
        // Also stops Space from clicking a focused button and arrows from scrolling.
        e.preventDefault()
        return
      }
      if (e.code === 'KeyE' && nearRef.current && !e.repeat) {
        e.preventDefault()
        useWorld.getState().focus(nearRef.current)
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (!k) return
      rideInput[k] = false
      e.preventDefault()
    }
    // Keys released while the tab was in the background never send keyup.
    const release = () => resetRideInput()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
      resetRideInput()
    }
  }, [])

  // Speedometer and landmark proximity, read from the car every frame;
  // React only hears about it when the nearby landmark changes.
  useEffect(() => {
    let raf = 0
    let shown = -1
    const tick = () => {
      const kmh = Math.round(Math.abs(car.speed) * KMH)
      if (kmh !== shown) {
        shown = kmh
        if (speedText.current) speedText.current.textContent = String(kmh)
        if (speedBar.current) {
          speedBar.current.style.transform = `scaleX(${Math.abs(car.speed) / RIDE.maxSpeed})`
        }
      }
      const n = landmarkNear(car.x, car.z)
      if (n !== nearRef.current) {
        nearRef.current = n
        setNear(n)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const r = strings.ride
  const nearCfg = near ? LANDMARKS[near] : null

  return (
    <>
      <TimedHint ms={8000} className="pointer-coarse:hidden">
        {r.hint}
      </TimedHint>

      {/* Nearby landmark: E, Enter on the button, or a tap opens it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-40 flex justify-center px-3 pointer-coarse:bottom-40">
        {near && nearCfg && (
          <button
            type="button"
            onClick={() => focus(near)}
            className="world-card world-btn world-rise pointer-events-auto gap-3 rounded-2xl! py-2 pr-3 pl-2 text-left"
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-(--w-paper)"
              style={{ color: nearCfg.accent, border: `2px solid ${nearCfg.accent}` }}
            >
              <SectionIcon section={nearCfg.section} className="size-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold">
                {r.open} {strings.landmarks[near].section}
              </span>
              <span className="text-xs font-normal text-(--w-ink-soft)">{strings.landmarks[near].name}</span>
            </span>
            <kbd className="world-kbd pointer-coarse:hidden">E</kbd>
          </button>
        )}
      </div>

      {/* Speedometer and the way off. Moves up on touch screens, where the pedals sit. */}
      <div className="absolute right-3 bottom-5 z-40 flex items-center gap-2 sm:right-4 pointer-coarse:top-18 pointer-coarse:bottom-auto">
        <div className="world-card flex w-28 flex-col gap-1 rounded-2xl! px-3 py-2" aria-hidden>
          <span className="flex items-baseline gap-1">
            <span ref={speedText} className="font-heading text-2xl leading-none font-bold tabular-nums">
              0
            </span>
            <span className="text-[11px] font-semibold text-(--w-ink-soft)">{r.speed}</span>
          </span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-(--w-paper-2)">
            <span
              ref={speedBar}
              className="block h-full origin-left rounded-full bg-(--w-gold)"
              style={{ transform: 'scaleX(0)' }}
            />
          </span>
        </div>
        <button
          type="button"
          onClick={stopRide}
          className="world-card world-btn size-14 shrink-0 flex-col justify-center gap-0.5 rounded-2xl! text-[10px]"
          title={`${r.exit} (Esc)`}
        >
          <LogOut className="size-5" aria-hidden />
          {r.exit}
        </button>
      </div>

      {/* Touch pedals: steering on the left thumb, throttle and brake on the right. */}
      <div className="absolute bottom-5 left-3 z-40 hidden gap-2 pointer-coarse:flex">
        <Pedal input="left" label={r.left}>
          <ChevronLeft className="size-7" aria-hidden />
        </Pedal>
        <Pedal input="right" label={r.right}>
          <ChevronRight className="size-7" aria-hidden />
        </Pedal>
      </div>
      <div className="absolute right-3 bottom-5 z-40 hidden flex-col gap-2 pointer-coarse:flex">
        <Pedal input="up" label={r.gas}>
          <ChevronUp className="size-7" aria-hidden />
        </Pedal>
        <Pedal input="down" label={r.brake}>
          <ChevronDown className="size-7" aria-hidden />
        </Pedal>
      </div>
    </>
  )
}

/** A hold-to-press control: on while a finger is down, off however it lifts. */
function Pedal({
  input,
  label,
  children,
}: {
  input: keyof typeof rideInput
  label: string
  children: ReactNode
}) {
  const off = () => void (rideInput[input] = false)
  return (
    <button
      type="button"
      aria-label={label}
      className="world-card world-btn size-16 touch-none justify-center rounded-2xl! select-none active:bg-(--w-paper-2)"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        rideInput[input] = true
      }}
      onPointerUp={off}
      onPointerCancel={off}
      onLostPointerCapture={off}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}
