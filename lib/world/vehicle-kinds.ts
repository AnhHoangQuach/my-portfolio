/**
 * Vehicle model names in `public/models/vehicles.glb` (see
 * `scripts/build-models.mjs`). Kept apart from the loader so the
 * traffic code can name models without pulling GLTFLoader into its chunk.
 */
export const CAR_MODELS = ['sedan', 'taxi', 'hatchback', 'suv', 'van', 'pickup'] as const
export type CarModel = (typeof CAR_MODELS)[number]

/** The visitor's own car in ride mode. */
export const PLAYER_CAR: CarModel = 'hatchback'

/** How often each car model turns up in traffic (Da Nang: plenty of taxis). */
export const CAR_MIX: Record<CarModel, number> = {
  sedan: 3,
  taxi: 2.5,
  hatchback: 2,
  suv: 2,
  van: 1,
  pickup: 1,
}
