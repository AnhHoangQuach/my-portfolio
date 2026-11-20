/**
 * Minimal types for `n8ao`, which ships none. Covers only what
 * `components/world/scene/post-fx.tsx` uses.
 */
declare module 'n8ao' {
  import type { Pass } from 'postprocessing'
  import type { Camera, Color, Scene } from 'three'

  export interface N8AOConfiguration {
    aoRadius: number
    distanceFalloff: number
    intensity: number
    color: Color
    halfRes: boolean
    gammaCorrection: boolean
    depthAwareUpsampling: boolean
    screenSpaceRadius: boolean
  }

  export class N8AOPostPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number)
    configuration: N8AOConfiguration
    setQualityMode(mode: 'Performance' | 'Low' | 'Medium' | 'High' | 'Ultra'): void
  }
}
