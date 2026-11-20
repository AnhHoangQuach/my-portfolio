import { create } from 'zustand'

import type { LandmarkId } from './landmarks'

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

interface WorldState {
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
}

let nonce = 0
const next = () => ++nonce

export const useWorld = create<WorldState>()((set, get) => ({
  phase: 'loading',
  loadStage: 0,
  activeId: null,
  hoveredId: null,
  transitioning: false,
  command: { kind: 'intro', nonce: 0 },
  fireNonce: 0,
  reducedMotion: false,
  deepLink: null,

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
    const { phase, activeId } = get()
    if (phase === 'loading') return
    if (activeId === id && phase === 'explore') return
    set({
      phase: 'explore',
      activeId: id,
      hoveredId: null,
      command: { kind: 'focus', id, nonce: next() },
    })
  },

  back: () => set({ activeId: null, command: { kind: 'overview', nonce: next() } }),

  resetView: () => set({ activeId: null, command: { kind: 'overview', nonce: next() } }),

  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id })
  },

  setTransitioning: (value) => set({ transitioning: value }),

  breatheFire: () => set((s) => ({ fireNonce: s.fireNonce + 1 })),

  setReducedMotion: (value) => set({ reducedMotion: value }),

  setDeepLink: (id) => set({ deepLink: id }),
}))
