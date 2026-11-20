/**
 * Single source of truth for every interactive landmark: where it sits, how
 * the camera frames it, how big its hit area is, and which portfolio section
 * it opens. Move a landmark here and its model, marker, indicator ring, hit
 * volume and camera shot all follow.
 *
 * Axes: +X is east, −Z is north, +Y is up. One unit ≈ 60 m of real Da Nang,
 * with the distances between landmarks compressed for composition.
 */

export type LandmarkId =
  | 'dragon-bridge'
  | 'city-center'
  | 'son-tra'
  | 'my-khe'
  | 'marble-mountains'
  | 'love-bridge'

export type SectionId = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'contact'

export type Vec3 = readonly [number, number, number]

export interface LandmarkConfig {
  id: LandmarkId
  section: SectionId
  /** Ground anchor of the landmark (indicator ring, sparkles). */
  position: Vec3
  /** Where the floating marker hovers, relative to `position`. */
  markerOffset: Vec3
  /** Indicator ring radius on the ground. */
  ringRadius: number
  /** Invisible box used for pointer hits: centre (relative) and size. */
  hit: { center: Vec3; size: Vec3 }
  /** Camera shot when the landmark is focused. */
  camera: { position: Vec3; target: Vec3 }
  /** Accent used by the marker, ring and sparkles. */
  accent: string
}

export const LANDMARKS: Record<LandmarkId, LandmarkConfig> = {
  'dragon-bridge': {
    id: 'dragon-bridge',
    section: 'home',
    position: [0.6, 0, 0],
    markerOffset: [0, 5.2, 0],
    ringRadius: 7.5,
    hit: { center: [0, 1.6, 0], size: [15, 3.6, 3.6] },
    camera: { position: [20, 8.5, -11], target: [5, 1.8, 0.5] },
    accent: '#F2B632',
  },
  'city-center': {
    id: 'city-center',
    section: 'about',
    position: [-18, 0, -2],
    markerOffset: [10.5, 17.5, -8],
    ringRadius: 13,
    hit: { center: [-1, 3, 4], size: [28, 6, 44] },
    camera: { position: [4, 22, 26], target: [-15, 2.5, -4] },
    accent: '#F28C7B',
  },
  'son-tra': {
    id: 'son-tra',
    section: 'skills',
    position: [29, 0, -34],
    markerOffset: [0, 9.5, 0],
    ringRadius: 12,
    hit: { center: [0, 3, 0], size: [26, 7, 24] },
    camera: { position: [6, 26, 4], target: [27, 2, -31] },
    accent: '#6A9C89',
  },
  'my-khe': {
    id: 'my-khe',
    section: 'projects',
    position: [25, 0, 8],
    markerOffset: [0, 4.5, 0],
    ringRadius: 8,
    hit: { center: [0.5, 1.2, 0], size: [9, 2.6, 40] },
    camera: { position: [47, 15, 22], target: [23, 0.5, 6] },
    accent: '#69C5C0',
  },
  'marble-mountains': {
    id: 'marble-mountains',
    section: 'experience',
    position: [10.5, 0, 29],
    markerOffset: [-0.5, 12.6, -2],
    ringRadius: 9,
    hit: { center: [0, 3.5, 0], size: [16, 8, 17] },
    camera: { position: [-7, 14, 47], target: [10.5, 3.8, 28] },
    accent: '#B9A6D6',
  },
  'love-bridge': {
    id: 'love-bridge',
    section: 'contact',
    position: [3.9, 0, -7.2],
    markerOffset: [0, 3.6, 0],
    ringRadius: 4,
    hit: { center: [0, 0.8, 0], size: [7, 2, 3] },
    camera: { position: [-5.5, 7, 0.5], target: [3.9, 0.7, -7.2] },
    accent: '#F2748A',
  },
}

/** Landmark for a portfolio section — used to resolve `/?at=<section>` links. */
export function landmarkForSection(section: string | null): LandmarkId | null {
  if (!section) return null
  const hit = Object.values(LANDMARKS).find((l) => l.section === section || l.id === section)
  return hit?.id ?? null
}

/** Display order for the dock and the menu — the order of the journey. */
export const LANDMARK_ORDER: LandmarkId[] = [
  'dragon-bridge',
  'city-center',
  'son-tra',
  'my-khe',
  'marble-mountains',
  'love-bridge',
]

/** Wide establishing shot the explore mode starts from. */
export const OVERVIEW_SHOT = {
  // A city-builder view: the whole city in frame, the bay, Son Tra and the
  // mountains beyond, and the horizon along the top.
  position: [36, 44, 142] as Vec3,
  target: [2, 0, -8] as Vec3,
}

/** Last frame of the intro flight: hovering over the Dragon Bridge. */
export const WELCOME_SHOT = {
  position: [16, 13, 22] as Vec3,
  target: [1, 1.6, 0] as Vec3,
}

/** Intro flight: camera path and look-at path, sampled together. */
export const INTRO_PATH = {
  position: [
    [-36, 170, 160],
    [-12, 118, 112],
    [24, 72, 62],
    [34, 40, 34],
    WELCOME_SHOT.position,
  ] as Vec3[],
  target: [
    [4, 0, -14],
    [14, 0, -26],
    [18, 0, -22],
    [6, 0.8, -4],
    WELCOME_SHOT.target,
  ] as Vec3[],
}
