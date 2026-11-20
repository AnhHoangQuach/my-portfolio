'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  KernelSize,
  RenderPass,
  SMAAEffect,
  TiltShiftEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'
import * as THREE from 'three'

/**
 * The "photograph of a handmade miniature" pass:
 * - N8AO: contact shadows where buildings, trees and rocks meet the ground.
 * - Bloom: only HDR light sources (lamps, lanterns, fire, glints) exceed the
 *   threshold, so sunlit walls never glow.
 * - Tilt-shift: the narrow horizontal focus band of macro photography.
 * - Neutral tone mapping, a soft vignette, SMAA for clean edges.
 *
 * Built directly on `postprocessing` (which tree-shakes) rather than the
 * React wrapper, whose single bundled module registers every effect it ships.
 * Only mounted on the high tier, and loaded as its own chunk.
 */
/** Builds the full effect chain. Called from an effect, never during render. */
function createComposer(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const c = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 })
  c.addPass(new RenderPass(scene, camera))

  const ao = new N8AOPostPass(scene, camera)
  ao.setQualityMode('Medium')
  Object.assign(ao.configuration, {
    halfRes: true,
    aoRadius: 2.4,
    distanceFalloff: 0.9,
    intensity: 2.2,
    color: new THREE.Color('#3a2c24'),
    // Gamma-correcting mid-chain would encode sRGB twice and wash out the
    // frame; the final pass handles output colour space.
    gammaCorrection: false,
  })
  c.addPass(ao)

  // Sunlit surfaces peak around 1.4 in linear light; only boosted emitters
  // (see GLOW in lib/world/materials.ts) and water glints clear 1.5.
  c.addPass(
    new EffectPass(
      camera,
      new BloomEffect({
        mipmapBlur: true,
        luminanceThreshold: 1.5,
        luminanceSmoothing: 0.2,
        intensity: 0.8,
        radius: 0.65,
      }),
    ),
  )
  c.addPass(
    new EffectPass(
      camera,
      new TiltShiftEffect({
        offset: 0.02,
        // A wide sharp band; only the top and bottom edges soften.
        focusArea: 0.78,
        feather: 0.3,
        kernelSize: KernelSize.SMALL,
        resolutionScale: 0.5,
      }),
    ),
  )
  c.addPass(
    new EffectPass(
      camera,
      new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      new VignetteEffect({ offset: 0.32, darkness: 0.38 }),
    ),
  )
  c.addPass(new EffectPass(camera, new SMAAEffect()))
  return c
}

export default function PostFX() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const get = useThree((s) => s.get)

  /**
   * The composer is created and disposed by the same effect. Creating it in
   * useMemo and disposing it in a cleanup broke under React Strict Mode (dev):
   * the immediate cleanup emptied the composer's passes, and since this
   * component owns rendering, the canvas froze — no intro, no zoom, no clicks.
   */
  const composer = useRef<EffectComposer | null>(null)

  useEffect(() => {
    const c = createComposer(gl, scene, camera)
    const { width, height } = get().size
    c.setSize(width, height)
    composer.current = c
    return () => {
      composer.current = null
      c.dispose()
    }
  }, [gl, scene, camera, get])

  useEffect(() => {
    composer.current?.setSize(size.width, size.height)
  }, [size, dpr])

  // Priority 1 takes over rendering from R3F while mounted; until the
  // composer exists, keep drawing the plain scene so the canvas never stalls.
  useFrame((_, delta) => {
    const c = composer.current
    if (c) c.render(delta)
    else gl.render(scene, camera)
  }, 1)

  return null
}
