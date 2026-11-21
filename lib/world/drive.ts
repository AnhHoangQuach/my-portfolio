import { MARBLE_PEAKS, hillHeight, isLand } from './geo'
import { BRIDGES, layout, riverRoadX, type Building } from './layout'
import { LANDMARKS, LANDMARK_ORDER, type LandmarkId } from './landmarks'

/**
 * Ride mode: the visitor's own car. Plain mutable state, advanced once per
 * frame by `components/world/scene/player-car.tsx` and read by the camera
 * rig, the mini-map and the ride HUD — never React state.
 *
 * Heading `h` points the car along (cos h, sin h) in the XZ plane, so h = 0
 * drives east and a positive steer (left) turns toward −Z (north).
 */

export const RIDE = {
  /** World units per second; the HUD shows `speed * KMH`. */
  maxSpeed: 4,
  maxReverse: 1,
  accel: 2.6,
  brake: 7,
  /** Rolling resistance with no input. */
  drag: 1.4,
  /** Radians per second at full lock and speed. */
  turn: 2.3,
  /**
   * Collision footprint: two circles of this radius, `axle` ahead of and
   * behind the centre — a capsule about the size of the car (~0.48 × 0.22).
   */
  radius: 0.11,
  axle: 0.13,
} as const

/** Speedometer scale: top speed reads 60 km/h. */
export const KMH = 15

/** Where every ride starts: eastbound on Hai Chau's main axis, right-hand lane. */
export const RIDE_START = { x: -9, z: 0.35, heading: 0 } as const

/** Keeps the ride inside the camera rig's orbit boundary. */
const BOUNDS = { x0: -105, x1: 85, z0: -85, z1: 115 } as const

export const car: {
  x: number
  z: number
  y: number
  heading: number
  speed: number
  steer: number
} = {
  x: RIDE_START.x,
  z: RIDE_START.z,
  y: 0.04,
  heading: RIDE_START.heading,
  speed: 0,
  /** Smoothed steering input, −1 (right) … 1 (left); also drives the body roll. */
  steer: 0,
}

/** Held controls, written by the keyboard and the touch pad. */
export const rideInput = { up: false, down: false, left: false, right: false, brake: false }

export function resetRideInput() {
  rideInput.up = rideInput.down = rideInput.left = rideInput.right = rideInput.brake = false
}

export function resetCar() {
  car.x = RIDE_START.x
  car.z = RIDE_START.z
  car.y = 0.04
  car.heading = RIDE_START.heading
  car.speed = 0
  car.steer = 0
  resetRideInput()
}

/**
 * Where the camera is and which way it looks, flattened to the ground plane.
 * Written by the camera rig each frame, read by the mini-map.
 */
export const cameraProbe = { x: 0, z: 0, yaw: 0, ready: false }

/* ------------------------------------------------------------------------ */
/* Where a car can go                                                        */
/* ------------------------------------------------------------------------ */

/** Half-width of each bridge's carriageway. */
const SPAN_HALF: Record<keyof typeof BRIDGES, number> = { hanRiver: 0.6, dragon: 1, tranThiLy: 0.6 }

/** The bridge span under (x, z), if any. */
export function bridgeAt(x: number, z: number): keyof typeof BRIDGES | null {
  for (const key of Object.keys(BRIDGES) as (keyof typeof BRIDGES)[]) {
    const bz = BRIDGES[key]
    if (Math.abs(z - bz) > SPAN_HALF[key]) continue
    if (x > riverRoadX('west', bz) - 0.3 && x < riverRoadX('east', bz) + 0.3) return key
  }
  return null
}

/** Buildings bucketed on a coarse grid, so a collision test reads one cell. */
const CELL = 4
const grid = (() => {
  const map = new Map<string, Building[]>()
  const all = [...layout.cityBuildings, ...layout.eastBuildings, ...layout.outskirtBuildings]
  for (const b of all) {
    const r = Math.hypot(b.w, b.d) / 2 + RIDE.radius
    for (let cx = Math.floor((b.x - r) / CELL); cx <= Math.floor((b.x + r) / CELL); cx++) {
      for (let cz = Math.floor((b.z - r) / CELL); cz <= Math.floor((b.z + r) / CELL); cz++) {
        const key = `${cx}:${cz}`
        const list = map.get(key)
        if (list) list.push(b)
        else map.set(key, [b])
      }
    }
  }
  return map
})()

function hitsBuilding(x: number, z: number) {
  const list = grid.get(`${Math.floor(x / CELL)}:${Math.floor(z / CELL)}`)
  if (!list) return false
  for (const b of list) {
    // Into the building's own frame (the inverse of its rotation.y).
    const dx = x - b.x
    const dz = z - b.z
    const c = Math.cos(b.rot)
    const s = Math.sin(b.rot)
    const lx = dx * c - dz * s
    const lz = dx * s + dz * c
    if (Math.abs(lx) < b.w / 2 + RIDE.radius && Math.abs(lz) < b.d / 2 + RIDE.radius) return true
  }
  return false
}

/** Open ground or a bridge deck: not water, hillside, rock or a building. */
export function rideable(x: number, z: number) {
  if (x < BOUNDS.x0 || x > BOUNDS.x1 || z < BOUNDS.z0 || z > BOUNDS.z1) return false
  if (bridgeAt(x, z)) return true
  if (!isLand(x, z, 0.15)) return false
  if (hillHeight(x, z) > 0.2) return false
  for (const p of MARBLE_PEAKS) if (Math.hypot(x - p.x, z - p.z) < p.r * 1.05) return false
  return !hitsBuilding(x, z)
}

/* ------------------------------------------------------------------------ */
/* Simulation                                                                */
/* ------------------------------------------------------------------------ */

/** The car's footprint, at (x, z) facing `heading`, is all on rideable ground. */
export function carFits(x: number, z: number, heading: number) {
  const ax = Math.cos(heading) * RIDE.axle
  const az = Math.sin(heading) * RIDE.axle
  return rideable(x + ax, z + az) && rideable(x - ax, z - az)
}

const approach = (v: number, goal: number, step: number) =>
  v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step)

/** One physics step: throttle, brakes, steering, then a collision-checked move. */
export function stepCar(dt: number) {
  const inp = rideInput
  const throttle = (inp.up ? 1 : 0) - (inp.down ? 1 : 0)
  if (inp.brake) car.speed = approach(car.speed, 0, RIDE.brake * dt)
  else if (throttle > 0) car.speed += (car.speed < 0 ? RIDE.brake : RIDE.accel) * dt
  else if (throttle < 0) car.speed -= (car.speed > 0 ? RIDE.brake : RIDE.accel * 0.6) * dt
  else car.speed = approach(car.speed, 0, RIDE.drag * dt)
  car.speed = Math.min(RIDE.maxSpeed, Math.max(-RIDE.maxReverse, car.speed))

  const steerGoal = (inp.left ? 1 : 0) - (inp.right ? 1 : 0)
  car.steer += (steerGoal - car.steer) * (1 - Math.exp(-8 * dt))
  // No turning on the spot; reversing turns the other way, like a real car.
  const grip = Math.min(1, Math.abs(car.speed) / 1.2) * Math.sign(car.speed)
  const heading = car.heading - car.steer * RIDE.turn * grip * dt
  // Turning can swing the nose or tail into a wall; then it doesn't turn.
  if (carFits(car.x, car.z, heading)) car.heading = heading

  const step = car.speed * dt
  if (step === 0) return
  const dx = Math.cos(car.heading) * step
  const dz = Math.sin(car.heading) * step
  // Glancing contact slides along the wall, but only along an axis the car
  // is really moving on; head-on, "sliding" by nothing would creep forever.
  const slide = Math.abs(step) * 0.25
  const h = car.heading
  if (carFits(car.x + dx, car.z + dz, h)) {
    car.x += dx
    car.z += dz
  } else if (Math.abs(dx) > slide && carFits(car.x + dx, car.z, h)) {
    car.x += dx
    car.speed *= 0.92
  } else if (Math.abs(dz) > slide && carFits(car.x, car.z + dz, h)) {
    car.z += dz
    car.speed *= 0.92
  } else {
    // Head-on: stop. (A bounce made the car judder against the wall while
    // the throttle was held.)
    car.speed = 0
  }
}

/** Landmark whose ring the car is in (or nearly), the most central one first. */
export function landmarkNear(x: number, z: number): LandmarkId | null {
  let best: LandmarkId | null = null
  let bestD = 1.5
  for (const id of LANDMARK_ORDER) {
    const l = LANDMARKS[id]
    const d = Math.hypot(x - l.position[0], z - l.position[2]) - l.ringRadius
    if (d < bestD) {
      bestD = d
      best = id
    }
  }
  return best
}
