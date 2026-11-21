import * as THREE from 'three'

/**
 * Time of day for the world, driven by the real clock in Da Nang (see
 * `clock.ts`): the sun's path plus a handful of shared shader uniforms,
 * updated once per frame by `components/world/scene/daylight.tsx` and read by
 * every material that reacts to the time (water, facades, lamps, clouds, sky).
 */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface SkyState {
  /** Unit vector toward the sun (may point below the horizon). */
  sunDir: THREE.Vector3
  /** 0 = full day, 1 = full night. */
  night: number
  /** 0..1, strongest when the sun sits low on the horizon (dawn / dusk). */
  dusk: number
}

/**
 * Sun path for Da Nang (~16°N): rises in the east about 06:00, crosses high
 * in the southern sky at noon, sets in the west about 18:00. +X is east,
 * +Z is south in this world.
 */
export function skyAt(hour: number, out: SkyState): SkyState {
  const t = (hour - 6) / 12
  const angle = Math.PI * t
  out.sunDir.set(Math.cos(angle), Math.sin(angle) * 1.45, 0.42).normalize()
  const y = out.sunDir.y
  out.night = 1 - smooth(-0.14, 0.06, y)
  out.dusk = smooth(-0.1, 0.04, y) * (1 - smooth(0.12, 0.38, y))
  return out
}

/** Where the moonlight comes from at night (fixed, high in the south-west). */
export const MOON_DIR = new THREE.Vector3(-0.35, 0.78, 0.5).normalize()

/** Shared uniforms; one object each, so every material sees the same value. */
export const daylight = {
  night: { value: 0 },
  sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.4).normalize() },
  sunColor: { value: new THREE.Color('#FFE3B8').multiplyScalar(2.2) },
  skyTop: { value: new THREE.Color('#5b8fc7') },
  skyHorizon: { value: new THREE.Color('#c9d9e3') },
}
