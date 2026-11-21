import * as THREE from 'three'

import type { Building } from '@/lib/world/layout'

/**
 * Fits City Kit models to the procedural layout's lots (see
 * `kit-buildings.tsx`). Plain TypeScript, no React, so it can be checked
 * outside the browser.
 */

const letters = (s: string, prefix: string) => s.split('').map((c) => `${prefix}${c}`)

/** Kit models per building class, from City Kit (Commercial). */
export const CANDIDATES: Record<Building['kind'], string[]> = {
  // Narrow walk-ups and shophouses: the closest the kit gets to a nhà ống.
  house: letters('abcdefgh', 'building-'),
  mid: letters('ijklmn', 'building-'),
  tower: [...letters('abcde', 'skyscraper-'), 'building-m'],
}

const hash = (x: number, z: number) => {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return h - Math.floor(h)
}

export interface Placement {
  model: string
  matrix: THREE.Matrix4
  x: number
  z: number
  y: number
}

/** A lot longer than this (ratio of its sides) is split into a row of houses. */
const SPLIT_RATIO = 1.35
const MAX_SPLIT = 3

/**
 * Picks kit models for each lot and fits them to it exactly (footprint and
 * height), so the city's layout, collisions and landmarks don't move.
 *
 * Kit buildings are roughly square; Da Nang's tube houses are narrow and
 * deep. A long lot is therefore split along its length into two or three
 * houses back to back — which is how those streets look anyway — so no model
 * has to stretch far. Each piece gets the model whose proportions are
 * closest (trying both orientations), one of the best three by a position
 * hash for variety.
 */
export function placeKitBuildings(items: Building[], size: Record<string, THREE.Vector3>): Placement[] {
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const scl = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const out: Placement[] = []

  for (const b of items) {
    const alongDepth = b.d >= b.w
    const ratio = alongDepth ? b.d / b.w : b.w / b.d
    const n = ratio > SPLIT_RATIO ? Math.min(MAX_SPLIT, Math.round(ratio)) : 1
    const w = alongDepth ? b.w : b.w / n
    const d = alongDepth ? b.d / n : b.d
    const cos = Math.cos(b.rot)
    const sin = Math.sin(b.rot)

    for (let k = 0; k < n; k++) {
      // Piece centre in the lot's frame, then in the world (rotation.y = rot).
      const t = (k + 0.5) / n - 0.5
      const ox = alongDepth ? 0 : t * b.w
      const oz = alongDepth ? t * b.d : 0
      const x = b.x + ox * cos + oz * sin
      const z = b.z - ox * sin + oz * cos
      // Houses further down the row step down a little, for a broken skyline.
      const h = k === 0 ? b.h : b.h * (0.82 + 0.18 * hash(x + 3.1, z - 1.7))

      const options: { model: string; turned: boolean; cost: number }[] = []
      for (const model of CANDIDATES[b.kind]) {
        const s = size[model]
        if (!s) continue
        for (const turned of [false, true]) {
          // Model extents along the piece's width (w) and depth (d) axes.
          const mw = turned ? s.z : s.x
          const md = turned ? s.x : s.z
          const cost = Math.abs(Math.log(s.y / mw / (h / w))) + Math.abs(Math.log(md / mw / (d / w)))
          options.push({ model, turned, cost })
        }
      }
      options.sort((p, q) => p.cost - q.cost)
      const pick = options[Math.floor(hash(x, z) * Math.min(3, options.length))]
      const s = size[pick.model]
      // A quarter turn swaps which model axis spans the piece's width.
      const sx = pick.turned ? d / s.x : w / s.x
      const sz = pick.turned ? w / s.z : d / s.z
      quat.setFromAxisAngle(up, b.rot + (pick.turned ? Math.PI / 2 : 0))
      pos.set(x, 0, z)
      scl.set(sx, h / s.y, sz)
      out.push({ model: pick.model, matrix: new THREE.Matrix4().compose(pos, quat, scl), x, z, y: h / 2 })
    }
  }
  return out
}
