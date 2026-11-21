'use client'

import { useEffect } from 'react'
import { Flame } from 'lucide-react'

import { FIRE_SHOW, fireShowForced, isFireShowLive } from '@/lib/world/fire-show'
import { useWorld } from '@/lib/world/store'
import type { WorldStrings } from '../strings'

/**
 * Keeps the weekend fire show on the real clock: checks once a second and,
 * while the show is on, has the dragon breathe fire every `burstEvery`
 * seconds. Renders nothing; the HUD shows `FireShowBadge` while it's live.
 */
export function FireShowTicker() {
  useEffect(() => {
    const forced = fireShowForced()
    let lastBurst = 0
    const check = () => {
      const s = useWorld.getState()
      const live = forced || isFireShowLive()
      s.setFireShowLive(live)
      if (!live || s.phase === 'loading') return
      const now = Date.now()
      if (now - lastBurst >= FIRE_SHOW.burstEvery * 1000) {
        lastBurst = now
        s.breatheFire()
      }
    }
    check()
    const id = window.setInterval(check, 1000)
    return () => window.clearInterval(id)
  }, [])
  return null
}

/** "Live now" chip above the dock; flies to the Dragon Bridge. */
export function FireShowBadge({ strings }: { strings: WorldStrings }) {
  const live = useWorld((s) => s.fireShowLive)
  const focus = useWorld((s) => s.focus)
  if (!live) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-4 sm:bottom-32">
      <button
        type="button"
        onClick={() => focus('dragon-bridge')}
        className="world-card world-btn world-rise pointer-events-auto gap-2 rounded-full! py-1.5 pr-4 pl-2 text-left"
      >
        <span className="relative grid size-7 place-items-center rounded-full bg-(--w-gold) text-[#3a2a10]">
          <Flame className="size-4" aria-hidden />
          <span className="world-live-dot" aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-bold">{strings.fireShow.live}</span>
          <span className="text-[10px] font-normal text-(--w-ink-soft)">{strings.fireShow.schedule}</span>
        </span>
      </button>
    </div>
  )
}
