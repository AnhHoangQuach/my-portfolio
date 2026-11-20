'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { SUN_POSITION, getGlowTexture } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { rng } from '@/lib/world/geo'
import { QUALITY, type Quality } from '@/lib/world/quality'
import { useWorld } from '@/lib/world/store'

/* ------------------------------------------------------------------------ */
/* Sky + light                                                               */
/* ------------------------------------------------------------------------ */

export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(palette.sky.top) },
          uHorizon: { value: new THREE.Color(palette.sky.horizon) },
          uBottom: { value: new THREE.Color(palette.sky.bottom) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = mix(uHorizon, uTop, smoothstep(0.02, 0.6, h));
            col = mix(col, uBottom, 1.0 - smoothstep(-0.3, 0.02, h));
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[480, 32, 16]} />
    </mesh>
  )
}

export function Lights({ quality }: { quality: Quality }) {
  const size = QUALITY[quality].shadowMap
  return (
    <>
      <hemisphereLight args={['#FFF4E0', '#A7CFA0', 1.55]} />
      <ambientLight intensity={0.25} color={palette.warmWhite} />
      {/* Keyed on quality: a shadow map is allocated once, so a new size needs a new light. */}
      <directionalLight
        key={quality}
        castShadow
        position={SUN_POSITION}
        intensity={2.5}
        color="#FFE3B8"
        shadow-mapSize={[size, size]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-66}
        shadow-camera-right={66}
        shadow-camera-top={66}
        shadow-camera-bottom={-66}
        shadow-camera-near={1}
        shadow-camera-far={220}
      />
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Clouds                                                                    */
/* ------------------------------------------------------------------------ */

interface Puff {
  cloud: number
  ox: number
  oy: number
  oz: number
  s: number
}

interface CloudDef {
  x: number
  y: number
  z: number
  speed: number
  scale: number
}

function buildClouds(
  seed: number,
  count: number,
  area: number,
  y: [number, number],
  scale: [number, number],
  minRadius: number,
) {
  const r = rng(seed)
  const clouds: CloudDef[] = []
  const puffs: Puff[] = []
  for (let i = 0; i < count; i++) {
    // Scatter in a ring so the middle of the map stays clear.
    const a = r() * Math.PI * 2
    const d = minRadius + r() * (area - minRadius)
    const c: CloudDef = {
      x: Math.cos(a) * d,
      y: y[0] + r() * (y[1] - y[0]),
      z: Math.sin(a) * d,
      speed: 0.4 + r() * 0.6,
      scale: scale[0] + r() * (scale[1] - scale[0]),
    }
    clouds.push(c)
    const n = 4 + Math.floor(r() * 4)
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0 : k / (n - 1) - 0.5
      puffs.push({
        cloud: i,
        ox: t * 3.6 + (r() - 0.5) * 0.8,
        oy: (r() - 0.3) * 0.7 + (1 - Math.abs(t) * 1.6) * 0.6,
        oz: (r() - 0.5) * 1.6,
        s: 0.9 + (1 - Math.abs(t)) * 0.9 + r() * 0.4,
      })
    }
  }
  return { clouds, puffs }
}

/**
 * Low-poly puffs drifting east to west. All puffs of one layer share a single
 * instanced draw; positions update in place each frame without touching React.
 */
function CloudLayer({
  seed,
  count,
  area,
  y,
  scale,
  wrap,
  castShadow = false,
  opacity = 1,
  minRadius = 0,
  visibleIn,
}: {
  seed: number
  count: number
  area: number
  y: [number, number]
  scale: [number, number]
  wrap: number
  castShadow?: boolean
  opacity?: number
  minRadius?: number
  visibleIn?: (phase: string) => boolean
}) {
  const { clouds, puffs } = useMemo(
    () => buildClouds(seed, count, area, y, scale, minRadius),
    [seed, count, area, y, scale, minRadius],
  )
  const material = useMemo(() => createCloudMaterial(opacity), [opacity])
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const offsets = useMemo(() => clouds.map(() => 0), [clouds])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    if (visibleIn) m.visible = visibleIn(useWorld.getState().phase)
    if (!m.visible) return
    const dt = Math.min(delta, 0.1)
    clouds.forEach((c, i) => {
      offsets[i] -= c.speed * dt
    })
    puffs.forEach((p, i) => {
      const c = clouds[p.cloud]
      let x = c.x + offsets[p.cloud]
      x = ((((x + wrap) % (wrap * 2)) + wrap * 2) % (wrap * 2)) - wrap
      dummy.position.set(x + p.ox * c.scale, c.y + p.oy * c.scale, c.z + p.oz * c.scale)
      dummy.scale.setScalar(p.s * c.scale)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, puffs.length]}
      castShadow={castShadow}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

/**
 * Puffs dissolve as the camera gets close, so flying through a cloud reads as
 * mist rather than as a wall of giant polygons.
 */
function createCloudMaterial(opacity: number) {
  const m = new THREE.MeshLambertMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 0.3,
    flatShading: true,
    transparent: true,
    opacity,
  })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `diffuseColor.a *= smoothstep(6.0, 34.0, length(vViewPosition));
      #include <opaque_fragment>`,
    )
  }
  m.customProgramCacheKey = () => 'world-cloud'
  return m
}

const AMBIENT_Y: [number, number] = [16, 26]
const AMBIENT_SCALE: [number, number] = [0.9, 1.5]
const HIGH_Y: [number, number] = [96, 132]
const HIGH_SCALE: [number, number] = [5, 8]
const showHigh = (phase: string) => phase === 'loading' || phase === 'intro'

export function Clouds({ quality }: { quality: Quality }) {
  return (
    <>
      <CloudLayer
        seed={5}
        count={11}
        area={72}
        minRadius={50}
        y={AMBIENT_Y}
        scale={AMBIENT_SCALE}
        wrap={78}
        castShadow={QUALITY[quality].cloudShadows}
      />
      {/* The bank the intro camera falls through. Hidden once it's below. */}
      <CloudLayer
        seed={9}
        count={22}
        area={95}
        y={HIGH_Y}
        scale={HIGH_SCALE}
        wrap={130}
        opacity={0.9}
        visibleIn={showHigh}
      />
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Mist                                                                      */
/* ------------------------------------------------------------------------ */

/** Soft billboards hugging hills and mountains, breathing slowly. */
export function Mist({
  spots,
  color = '#ffffff',
  opacity = 0.32,
}: {
  spots: { x: number; y: number; z: number; s: number }[]
  color?: string
  opacity?: number
}) {
  const group = useRef<THREE.Group>(null)
  const texture = useMemo(() => getGlowTexture(), [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const sprite = child as THREE.Sprite
      const m = sprite.material as THREE.SpriteMaterial
      m.opacity = opacity * (0.7 + 0.3 * Math.sin(t * 0.35 + i * 1.7))
      sprite.position.x = spots[i].x + Math.sin(t * 0.12 + i) * 0.6
    })
  })

  return (
    <group ref={group}>
      {spots.map((s, i) => (
        <sprite key={i} position={[s.x, s.y, s.z]} scale={[s.s * 2.2, s.s, 1]}>
          <spriteMaterial
            map={texture}
            color={color}
            transparent
            opacity={opacity}
            depthWrite={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
}
