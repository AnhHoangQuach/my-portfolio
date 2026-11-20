'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Sky as SkyImpl } from 'three/examples/jsm/objects/Sky.js'

import { MOON_DIR, daNangHour, daylight, skyAt, type SkyState } from '@/lib/world/daylight'
import { palette } from '@/lib/world/palette'
import { QUALITY, type Quality } from '@/lib/world/quality'
import { useWorld } from '@/lib/world/store'

const C = (hex: string) => new THREE.Color(hex)

/** Key colours for day, golden hour and night. */
const TONE = {
  sunDay: C('#fff1dc'),
  sunDusk: C('#ff9b5c'),
  moon: C('#9fb4ff'),
  hemiSkyDay: C('#cfe0ef'),
  hemiSkyNight: C('#33446b'),
  hemiGroundDay: C('#5d5442'),
  hemiGroundNight: C('#15161c'),
  fogDay: C(palette.fog),
  fogDusk: C('#d4a68c'),
  fogNight: C('#111a29'),
  skyTopDay: C(palette.sky.top),
  skyTopDusk: C('#4d6994'),
  skyTopNight: C('#050a18'),
  horizonDay: C(palette.sky.horizon),
  horizonDusk: C('#e5a07a'),
  horizonNight: C('#18223a'),
}

/** Deep blue night dome with twinkling stars; fades in over the day sky. */
function createNightSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    uniforms: { uNight: daylight.night, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform float uTime;
      varying vec3 vDir;
      float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(vec3(0.03, 0.045, 0.09), vec3(0.004, 0.008, 0.025), smoothstep(0.0, 0.7, h));
        vec3 p = d * 260.0;
        vec3 cell = floor(p);
        float r = h3(cell);
        float star = step(0.992, r) * (1.0 - smoothstep(0.05, 0.32, length(fract(p) - 0.5)));
        float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + r * 3.0) + r * 40.0);
        col += vec3(0.9, 0.93, 1.0) * star * twinkle * smoothstep(0.04, 0.25, h) * 1.6;
        // Fades in late, so the physical sky's sunset glow shows at dusk.
        gl_FragColor = vec4(col, smoothstep(0.35, 1.0, uNight));
        #include <colorspace_fragment>
      }
    `,
  })
}

/**
 * The sun, the sky and everything they light, following the real clock in
 * Da Nang (or the Day / Night override). Each frame it eases the shared
 * `daylight` uniforms toward the target hour, so a switch — or dusk itself —
 * is a smooth blend rather than a cut, and updates the lights, haze and
 * exposure in place. Mounted first so every other frame callback sees this
 * frame's values.
 */
export function Daylight({ quality }: { quality: Quality }) {
  const skyRef = useRef<SkyImpl>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const nightDome = useRef<THREE.Mesh>(null)

  const sky = useMemo(() => {
    const s = new SkyImpl()
    s.scale.setScalar(1200)
    const u = s.material.uniforms
    u.turbidity.value = 2.6
    u.rayleigh.value = 2.1
    u.mieCoefficient.value = 0.003
    u.mieDirectionalG.value = 0.8
    return s
  }, [])
  const nightMaterial = useMemo(() => createNightSkyMaterial(), [])

  /** Eased state plus the clock cache; lives in a ref, mutated only here. */
  const state = useRef<{
    target: SkyState
    sunDir: THREE.Vector3
    night: number
    dusk: number
    clockAt: number
    hour: number
    ready: boolean
  } | null>(null)

  useFrame(({ clock, scene, gl }, delta) => {
    state.current ??= {
      target: { sunDir: new THREE.Vector3(), night: 0, dusk: 0 },
      sunDir: new THREE.Vector3(),
      night: 0,
      dusk: 0,
      clockAt: -1,
      hour: 12,
      ready: false,
    }
    const st = state.current
    const t = clock.elapsedTime

    // Re-read the clock once a second; the override wins when set.
    if (t - st.clockAt > 1 || st.clockAt < 0) {
      st.clockAt = t
      st.hour = daNangHour()
    }
    const override = useWorld.getState().timeOverride
    skyAt(override ?? st.hour, st.target)

    if (!st.ready) {
      st.sunDir.copy(st.target.sunDir)
      st.night = st.target.night
      st.dusk = st.target.dusk
      st.ready = true
    } else {
      const k = 1 - Math.exp(-1.6 * Math.min(delta, 0.1))
      st.sunDir.lerp(st.target.sunDir, k).normalize()
      st.night += (st.target.night - st.night) * k
      st.dusk += (st.target.dusk - st.dusk) * k
    }
    const { night, dusk } = st

    // Shared uniforms.
    daylight.night.value = night
    const lightDir = daylight.sunDir.value.copy(st.sunDir).lerp(MOON_DIR, night).normalize()
    const sunTone = TONE.sunDay.clone().lerp(TONE.sunDusk, dusk).lerp(TONE.moon, night)
    daylight.sunColor.value.copy(sunTone).multiplyScalar(2.2 * (1 - night * 0.7))
    daylight.skyTop.value.copy(TONE.skyTopDay).lerp(TONE.skyTopDusk, dusk).lerp(TONE.skyTopNight, night)
    daylight.skyHorizon.value
      .copy(TONE.horizonDay)
      .lerp(TONE.horizonDusk, dusk)
      .lerp(TONE.horizonNight, night)

    // Sky dome(s).
    skyRef.current?.material.uniforms.sunPosition.value.copy(st.sunDir)
    const dome = nightDome.current
    if (dome) {
      dome.visible = night > 0.01
      ;(dome.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    }

    // Lights.
    const sunUp = THREE.MathUtils.smoothstep(st.sunDir.y, -0.02, 0.25)
    if (sun.current) {
      sun.current.position.copy(lightDir).multiplyScalar(110)
      sun.current.color.copy(sunTone)
      sun.current.intensity = THREE.MathUtils.lerp(3.1 * sunUp, 0.55, night)
    }
    if (hemi.current) {
      hemi.current.intensity = THREE.MathUtils.lerp(1.25, 0.3, night) * (1 - dusk * 0.25)
      hemi.current.color.copy(TONE.hemiSkyDay).lerp(TONE.hemiSkyNight, night)
      hemi.current.groundColor.copy(TONE.hemiGroundDay).lerp(TONE.hemiGroundNight, night)
    }

    // Haze and exposure.
    const fog = scene.fog as THREE.FogExp2 | null
    if (fog) fog.color.copy(TONE.fogDay).lerp(TONE.fogDusk, dusk).lerp(TONE.fogNight, night)
    gl.toneMappingExposure = THREE.MathUtils.lerp(0.95, 1.2, night)

    // The UI flips theme past the halfway point, with a little hysteresis.
    const store = useWorld.getState()
    if (night > 0.55 && !store.nightUi) store.setNightUi(true)
    else if (night < 0.45 && store.nightUi) store.setNightUi(false)
  }, -1)

  const size = QUALITY[quality].shadowMap
  return (
    <>
      <primitive ref={skyRef} object={sky} />
      <mesh ref={nightDome} material={nightMaterial} renderOrder={-1} visible={false}>
        <sphereGeometry args={[560, 32, 16]} />
      </mesh>
      <hemisphereLight ref={hemi} args={['#cfe0ef', '#5d5442', 1.25]} />
      {/* Keyed on quality: a shadow map is allocated once, so a new size needs a new light. */}
      <directionalLight
        key={quality}
        ref={sun}
        castShadow
        position={[46, 68, 30]}
        intensity={3.1}
        color="#fff1dc"
        shadow-mapSize={[size, size]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-72}
        shadow-camera-right={72}
        shadow-camera-top={72}
        shadow-camera-bottom={-72}
        shadow-camera-near={1}
        shadow-camera-far={260}
      />
    </>
  )
}
