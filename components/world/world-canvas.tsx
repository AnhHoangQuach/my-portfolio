'use client'

import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

import type { LandmarkId } from '@/lib/world/landmarks'
import { INTRO_PATH } from '@/lib/world/landmarks'
import { timeUniform } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { QUALITY, detectQuality, forcedQuality, type Quality } from '@/lib/world/quality'
import { useWorld } from '@/lib/world/store'
import { CameraRig } from './camera-rig'
import { LandmarkLabelsProvider, type LandmarkLabel } from './landmark'
import { Clouds } from './scene/atmosphere'
import { Daylight } from './scene/daylight'
import { MyKheBeach } from './scene/beach'
import { HanRiverBridge, LoveBridge, TranThiLyBridge } from './scene/bridges'
import { CityCenter, EastBank, Greenery, Outskirts } from './scene/city'
import { DragonBridge } from './scene/dragon-bridge'
import { DragonFire } from './scene/dragon-fire'
import { MarbleMountains, SonTra } from './scene/mountains'
import { Roads } from './scene/roads'
import { StudioEnvironment } from './scene/environment'
import { Terrain } from './scene/terrain'
import { Boats, Cars } from './scene/vehicles'

// Post-processing (postprocessing + N8AO, ~175 KB gzip) is its own chunk,
// fetched only on the high tier and only once the scene is already on screen,
// so neither its download nor its shader compile delays the first view.
const PostFX = lazy(() => import('./scene/post-fx'))

function DeferredPostFX() {
  const live = useWorld((s) => s.phase !== 'loading')
  if (!live) return null
  return (
    <Suspense fallback={null}>
      <PostFX />
    </Suspense>
  )
}

/** Advances the one shared shader clock. */
function Clock() {
  useFrame((_, delta) => {
    timeUniform.value += Math.min(delta, 0.1)
  })
  return null
}

/**
 * Compiles every shader up front (so the intro never hitches on a first-use
 * compile), waits for a couple of real frames, then tells the store we're live.
 */
function ReadySignal() {
  const { gl, scene, camera } = useThree()
  const frames = useRef(-1)

  useEffect(() => {
    useWorld.getState().setLoadStage(2)
    let cancelled = false
    const compile = gl.compileAsync?.(scene, camera) ?? Promise.resolve()
    compile
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return
        useWorld.getState().setLoadStage(3)
        frames.current = 0
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])

  useFrame(() => {
    if (frames.current < 0) return
    frames.current++
    if (frames.current === 3) useWorld.getState().ready()
  })
  return null
}

/** Clears hover when the pointer leaves the canvas entirely. */
function PointerReset() {
  const { gl } = useThree()
  useEffect(() => {
    const el = gl.domElement
    const leave = () => {
      useWorld.getState().setHovered(null)
      document.body.style.cursor = ''
    }
    el.addEventListener('pointerleave', leave)
    return () => el.removeEventListener('pointerleave', leave)
  }, [gl])
  return null
}

export default function WorldCanvas({ labels }: { labels: Record<LandmarkId, LandmarkLabel> }) {
  const [quality, setQuality] = useState<Quality>(detectQuality)
  const [pinned] = useState(() => forcedQuality() !== null)
  const [dpr, setDpr] = useState<number>(QUALITY[quality].maxDpr)
  const start = INTRO_PATH.position[0]

  return (
    <Canvas
      className="absolute! inset-0"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, dpr]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        // Filmic response for the realistic look; the high tier applies the
        // same curve in its post-processing chain.
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
      camera={{ fov: 40, near: 0.5, far: 2000, position: [start[0], start[1], start[2]] }}
      onCreated={() => useWorld.getState().setLoadStage(1)}
    >
      <color attach="background" args={[palette.sky.horizon]} />
      {/* Exponential haze toward the horizon; distant hills fade into the sky. */}
      <fogExp2 attach="fog" args={[palette.fog, 0.0022]} />
      {/* Sustained low frame rate drops to the light tier, and stays there:
          flip-flopping would rebuild the shadow map over and over. */}
      <PerformanceMonitor
        onDecline={() => {
          if (pinned) return
          setQuality('low')
          setDpr(1)
        }}
        onIncline={() => setDpr(QUALITY[quality].maxDpr)}
      />

      <LandmarkLabelsProvider value={labels}>
        <Suspense fallback={null}>
          <Clock />
          <Daylight quality={quality} />
          <StudioEnvironment />
          <Clouds quality={quality} />

          <Terrain />
          <Roads />
          <Greenery />
          <EastBank />
          <Outskirts />

          <DragonBridge />
          <DragonFire />
          <CityCenter />
          <SonTra />
          <MyKheBeach />
          <MarbleMountains />
          <LoveBridge />
          <HanRiverBridge />
          <TranThiLyBridge />

          <Cars />
          <Boats />

          {quality === 'high' && <DeferredPostFX />}

          <CameraRig />
          <ReadySignal />
          <PointerReset />
        </Suspense>
      </LandmarkLabelsProvider>
    </Canvas>
  )
}
