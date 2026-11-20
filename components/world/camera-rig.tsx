'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'

import {
  INTRO_PATH,
  LANDMARKS,
  OVERVIEW_SHOT,
  WELCOME_SHOT,
  type Vec3,
} from '@/lib/world/landmarks'
import { useWorld, type CameraCommand } from '@/lib/world/store'

const LIMITS = {
  minDistance: 6,
  maxDistance: 340,
  minPolarAngle: 0.22,
  maxPolarAngle: 1.26,
}

/**
 * After a landmark click, further landmark clicks are ignored this long — just
 * enough to absorb a double-click. Camera input is never locked.
 */
const CLICK_GUARD_MS = 1200

/** Slow, cinematic damping for scripted moves; snappier for hand control. */
const SMOOTH_CINEMATIC = 0.85
const SMOOTH_INTERACTIVE = 0.32

const toVectors = (pts: Vec3[]) => pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))

interface IntroFlight {
  position: THREE.CatmullRomCurve3
  target: THREE.CatmullRomCurve3
  /** Clock time the flight started; set on its first frame. */
  start: number | null
  duration: number
}

/** Slow in, slow out (the curve GSAP calls power2.inOut). */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Mutable rig state shared by the flight helpers; lives in a ref. */
interface Rig {
  controls: CameraControlsImpl
  /** Live viewport size, read at call time (never captured during render). */
  viewport: () => { width: number; height: number }
  /** The intro flight in progress, advanced by the frame loop. */
  intro: IntroFlight | null
  /** Bumped by every move, so a superseded move knows not to clean up. */
  token: number
  /** Slow orbit behind the welcome card; stops the moment the visitor takes over. */
  drift: boolean
}

/** Pull the camera back on narrow screens so the shot still fits. */
function fit(rig: Rig, position: Vec3, target: Vec3, wide = 1): [THREE.Vector3, THREE.Vector3] {
  const p = new THREE.Vector3(...position)
  const t = new THREE.Vector3(...target)
  const { width, height } = rig.viewport()
  const a = width / Math.max(1, height)
  const base = a < 0.6 ? 1.95 : a < 0.8 ? 1.65 : a < 1.2 ? 1.3 : 1
  const k = 1 + (base - 1) * wide
  p.sub(t).multiplyScalar(k).add(t)
  return [p, t]
}

function stopTimeline(rig: Rig) {
  rig.intro = null
}

/**
 * Scripted flight to a shot. Input stays live throughout: the visitor's first
 * drag, scroll or pinch takes over immediately (see `takeOver`). Locking input
 * until the damped flight came to rest used to swallow zoom for ~5 s after
 * every click.
 */
async function flyTo(
  rig: Rig,
  [p, t]: [THREE.Vector3, THREE.Vector3],
  opts: { smooth?: number; focal?: number } = {},
) {
  const c = rig.controls
  const id = ++rig.token
  rig.drift = false
  useWorld.getState().setTransitioning(true)
  window.setTimeout(() => {
    if (id === rig.token) useWorld.getState().setTransitioning(false)
  }, CLICK_GUARD_MS)
  c.smoothTime = opts.smooth ?? SMOOTH_CINEMATIC
  c.maxDistance = LIMITS.maxDistance
  c.enabled = true
  await Promise.all([
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true),
    c.setFocalOffset(opts.focal ?? 0, 0, 0, true),
  ])
  // A newer move (or the visitor) superseded this one; nothing to clean up.
  if (id !== rig.token) return
  c.smoothTime = SMOOTH_INTERACTIVE
  useWorld.getState().setTransitioning(false)
}

/** The title card is up: hand the camera to the visitor, drifting until they touch it. */
function settleForWelcome(rig: Rig) {
  const c = rig.controls
  c.maxDistance = LIMITS.maxDistance
  c.smoothTime = SMOOTH_INTERACTIVE
  c.enabled = true
  rig.drift = true
}

/** The visitor grabbed the camera mid-flight: hand control back at once. */
function takeOver(rig: Rig) {
  if (!rig.controls.enabled || rig.intro) return
  rig.token++
  rig.drift = false
  rig.controls.smoothTime = SMOOTH_INTERACTIVE
  useWorld.getState().setTransitioning(false)
}

function playIntro(rig: Rig) {
  const c = rig.controls
  c.enabled = false
  c.smoothTime = 0.12
  // The flight starts far above the city, beyond the orbit limit.
  c.maxDistance = 600
  rig.intro = {
    position: new THREE.CatmullRomCurve3(toVectors(INTRO_PATH.position), false, 'centripetal'),
    target: new THREE.CatmullRomCurve3(toVectors(INTRO_PATH.target), false, 'centripetal'),
    start: null,
    duration: 10,
  }
}

const flightP = new THREE.Vector3()
const flightT = new THREE.Vector3()

/** One frame of the intro flight; returns false once it has landed. */
function stepIntro(rig: Rig, flight: IntroFlight, now: number) {
  flight.start ??= now
  const raw = Math.min(1, (now - flight.start) / flight.duration)
  const t = easeInOut(raw)
  flight.position.getPoint(t, flightP)
  flight.target.getPoint(t, flightT)
  const [p, q] = fit(rig, [flightP.x, flightP.y, flightP.z], [flightT.x, flightT.y, flightT.z], t)
  rig.controls.setLookAt(p.x, p.y, p.z, q.x, q.y, q.z, true)
  return raw < 1
}

function runCommand(rig: Rig, cmd: CameraCommand) {
  const c = rig.controls
  switch (cmd.kind) {
    case 'intro':
      playIntro(rig)
      return
    case 'welcome': {
      stopTimeline(rig)
      const [p, t] = fit(rig, WELCOME_SHOT.position, WELCOME_SHOT.target)
      c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, false)
      settleForWelcome(rig)
      return
    }
    case 'overview':
      stopTimeline(rig)
      void flyTo(rig, fit(rig, OVERVIEW_SHOT.position, OVERVIEW_SHOT.target), {
        smooth: cmd.instant ? 0.35 : SMOOTH_CINEMATIC,
      })
      return
    case 'focus': {
      stopTimeline(rig)
      const cfg = LANDMARKS[cmd.id]
      const [p, t] = fit(rig, cfg.camera.position, cfg.camera.target)
      // On wide screens, slide the subject left of the info panel.
      const focal = rig.viewport().width >= 1024 ? p.distanceTo(t) * 0.16 : 0
      void flyTo(rig, [p, t], { focal })
      return
    }
  }
}

/**
 * Owns the camera. Drei's CameraControls handles user orbit, zoom, touch and
 * damping; GSAP only advances a progress value for the intro, which this rig
 * turns into `setLookAt` calls. Nothing else in the app writes to the camera,
 * so a skip, a back, or a new landmark click can interrupt any move safely.
 */
export function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const rig = useRef<Rig | null>(null)
  const command = useWorld((s) => s.command)
  // Non-reactive accessor: the helpers read the live size when they run.
  const get = useThree((s) => s.get)

  // Configure once and hold the opening frame until the loading screen lifts.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    rig.current = { controls: c, viewport: () => get().size, intro: null, token: 0, drift: false }
    const [p] = toVectors([INTRO_PATH.position[0]])
    const [t] = toVectors([INTRO_PATH.target[0]])
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, false)
    // Configured imperatively: props would be re-applied on every re-render
    // and stomp on the temporary limits the flights set.
    c.minDistance = LIMITS.minDistance
    c.minPolarAngle = LIMITS.minPolarAngle
    c.maxPolarAngle = LIMITS.maxPolarAngle
    c.smoothTime = SMOOTH_INTERACTIVE
    c.draggingSmoothTime = 0.12
    // Zoom toward the orbit target, not the cursor: zooming to the cursor
    // slid the whole view sideways and flung the landmark markers around.
    c.dollyToCursor = false
    c.enabled = false
    c.maxDistance = 600
    c.setBoundary(new THREE.Box3(new THREE.Vector3(-48, -1, -50), new THREE.Vector3(48, 14, 48)))
    // Wheel input doesn't emit `controlstart`, so listen for it directly.
    const onInput = () => rig.current && takeOver(rig.current)
    const dom = get().gl.domElement
    c.addEventListener('controlstart', onInput)
    dom.addEventListener('wheel', onInput, { passive: true })
    return () => {
      c.removeEventListener('controlstart', onInput)
      dom.removeEventListener('wheel', onInput)
      if (rig.current) stopTimeline(rig.current)
    }
  }, [get])

  useEffect(() => {
    // Nonce 0 is the store's placeholder; the intro starts when `ready()` fires.
    if (!rig.current || command.nonce === 0) return
    runCommand(rig.current, command)
  }, [command])

  useFrame(({ clock }, delta) => {
    const r = rig.current
    if (!r) return
    // The intro flight; a skip or any other command clears `r.intro`.
    if (r.intro && !stepIntro(r, r.intro, clock.elapsedTime)) {
      r.intro = null
      settleForWelcome(r)
      useWorld.getState().finishIntro()
    }
    // Lazy drift while the title card is up — the city keeps breathing.
    const s = useWorld.getState()
    if (s.phase === 'welcome' && r.drift && !s.reducedMotion && !r.intro) {
      r.controls.rotate(delta * 0.035, 0, false)
    }
  })

  return <CameraControls ref={controls} makeDefault />
}
