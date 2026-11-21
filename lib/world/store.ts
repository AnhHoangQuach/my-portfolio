import { create } from 'zustand'

import type { LandmarkId } from './landmarks'
import type { Quality } from './quality'

/**
 * loading  → the canvas is compiling; loading screen up
 * intro    → cinematic flight in progress (user camera input disabled)
 * welcome  → flight finished, title card with "Explore" / "Skip"
 * explore  → free orbit; landmarks are interactive
 */
export type Phase = 'loading' | 'intro' | 'welcome' | 'explore'

/**
 * A request for the camera rig. The rig is the *only* thing that moves the
 * camera; everything else asks it to by bumping `nonce`.
 */
export type CameraCommand =
  | { kind: 'intro'; nonce: number }
  | { kind: 'welcome'; nonce: number }
  | { kind: 'overview'; nonce: number; instant?: boolean }
  | { kind: 'focus'; id: LandmarkId; nonce: number }
  /** Chase camera behind the visitor's car. */
  | { kind: 'ride'; nonce: number }

/**
 * Ride mode. `paused` keeps the car parked while a landmark panel is open;
 * closing the panel gets back in.
 */
export type RideState = 'off' | 'on' | 'paused'

interface WorldState {
  /**
   * The visitor has interacted (or pressed "Enter"), so the 3D world may
   * load. Until then the page is just the server-rendered welcome screen.
   */
  started: boolean
  phase: Phase
  /** 0–4 milestones while the scene boots; drives the loading bar. */
  loadStage: number
  activeId: LandmarkId | null
  hoveredId: LandmarkId | null
  /** True while the rig is flying to a shot; landmark clicks are ignored. */
  transitioning: boolean
  command: CameraCommand
  /** Incremented to make the dragon breathe fire. */
  fireNonce: number
  reducedMotion: boolean
  /** Landmark requested by the URL (`/?at=contact`); opened as soon as the scene is ready. */
  deepLink: LandmarkId | null
  /**
   * Time of day. `null` follows the real clock in Da Nang; a number pins the
   * hour (the Day / Night override, or `?time=` in the URL).
   */
  timeOverride: number | null
  /** True once it is dark enough for the UI to switch to its night theme. */
  nightUi: boolean
  ride: RideState
  /** The Dragon Bridge's weekend fire show is on right now. */
  fireShowLive: boolean
  /** Render tier, mirrored from the canvas for components deep in the scene. */
  quality: Quality

  /** Let the 3D world load; called on the first interaction. */
  start: () => void
  setLoadStage: (stage: number) => void
  /** Called once the scene has rendered its first frames. */
  ready: () => void
  finishIntro: () => void
  skipIntro: () => void
  explore: () => void
  focus: (id: LandmarkId) => void
  back: () => void
  resetView: () => void
  setHovered: (id: LandmarkId | null) => void
  setTransitioning: (value: boolean) => void
  breatheFire: () => void
  setReducedMotion: (value: boolean) => void
  setDeepLink: (id: LandmarkId | null) => void
  setTimeOverride: (hour: number | null) => void
  setNightUi: (value: boolean) => void
  /** Get in the car at the start line. */
  startRide: () => void
  /** Get out and fly back to the overview. */
  stopRide: () => void
  setFireShowLive: (value: boolean) => void
  setQuality: (value: Quality) => void
}

let nonce = 0
const next = () => ++nonce

export const useWorld = create<WorldState>()((set, get) => ({
  started: false,
  phase: 'loading',
  loadStage: 0,
  activeId: null,
  hoveredId: null,
  transitioning: false,
  command: { kind: 'intro', nonce: 0 },
  fireNonce: 0,
  reducedMotion: false,
  deepLink: null,
  timeOverride: null,
  nightUi: false,
  ride: 'off',
  fireShowLive: false,
  quality: 'high',

  start: () => {
    if (!get().started) set({ started: true })
  },

  setLoadStage: (stage) => set((s) => ({ loadStage: Math.max(s.loadStage, stage) })),

  ready: () => {
    if (get().phase !== 'loading') return
    // Arrived from a link to a section: skip the flight, go straight there.
    const target = get().deepLink
    if (target) {
      set({
        phase: 'explore',
        loadStage: 4,
        deepLink: null,
        activeId: target,
        command: { kind: 'focus', id: target, nonce: next() },
      })
      return
    }
    // Reduced motion: no flight — cut straight to the title card.
    if (get().reducedMotion) {
      set({ phase: 'welcome', loadStage: 4, command: { kind: 'welcome', nonce: next() } })
    } else {
      set({ phase: 'intro', loadStage: 4, command: { kind: 'intro', nonce: next() } })
    }
  },

  finishIntro: () => {
    if (get().phase === 'intro') set({ phase: 'welcome' })
  },

  skipIntro: () =>
    set({
      phase: 'explore',
      activeId: null,
      command: { kind: 'overview', nonce: next(), instant: true },
    }),

  explore: () =>
    set({ phase: 'explore', activeId: null, command: { kind: 'overview', nonce: next() } }),

  focus: (id) => {
    const { phase, activeId, ride } = get()
    if (phase === 'loading') return
    if (activeId === id && phase === 'explore') return
    set({
      phase: 'explore',
      activeId: id,
      hoveredId: null,
      ride: ride === 'on' ? 'paused' : ride,
      command: { kind: 'focus', id, nonce: next() },
    })
  },

  back: () => {
    // Opened from the driver's seat: closing the panel puts the visitor back in the car.
    if (get().ride === 'paused') {
      set({ activeId: null, ride: 'on', command: { kind: 'ride', nonce: next() } })
      return
    }
    set({ activeId: null, command: { kind: 'overview', nonce: next() } })
  },

  resetView: () => set({ activeId: null, ride: 'off', command: { kind: 'overview', nonce: next() } }),

  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id })
  },

  setTransitioning: (value) => set({ transitioning: value }),

  breatheFire: () => set((s) => ({ fireNonce: s.fireNonce + 1 })),

  setReducedMotion: (value) => set({ reducedMotion: value }),

  setDeepLink: (id) => set({ deepLink: id }),

  setTimeOverride: (hour) => set({ timeOverride: hour }),

  setNightUi: (value) => {
    if (get().nightUi !== value) set({ nightUi: value })
  },

  startRide: () => {
    if (get().phase === 'loading') return
    set({
      phase: 'explore',
      activeId: null,
      hoveredId: null,
      ride: 'on',
      command: { kind: 'ride', nonce: next() },
    })
  },

  stopRide: () => {
    if (get().ride === 'off') return
    set({ activeId: null, ride: 'off', command: { kind: 'overview', nonce: next() } })
  },

  setFireShowLive: (value) => {
    if (get().fireShowLive !== value) set({ fireShowLive: value })
  },

  setQuality: (value) => {
    if (get().quality !== value) set({ quality: value })
  },
}))
