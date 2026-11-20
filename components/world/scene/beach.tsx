'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { EAST_COAST, WORLD, resample, rng, type XZ } from '@/lib/world/geo'
import { layout, type Building, type PalmInstance } from '@/lib/world/layout'
import { createSwayMaterial, timeUniform, withSurfaceDetail } from '@/lib/world/materials'
import { palette } from '@/lib/world/palette'
import { Landmark } from '../landmark'
import { Buildings } from './instanced'

const COAST: XZ[] = resample(
  EAST_COAST.filter(([, z]) => z <= 34),
  0.8,
)

/** Seaward unit normal at each coast sample. */
function coastFrames(line: XZ[]) {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)]
    const b = line[Math.min(line.length - 1, i + 1)]
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const len = Math.hypot(dx, dz) || 1
    // Coast runs south → north; east (seaward) is the tangent rotated −90°.
    return { p, nx: -dz / len, nz: dx / len }
  })
}

/** Rows of a strip laid across the coast: [seaward offset, height, colour]. */
function coastStrip(rows: [number, number, string][]) {
  const frames = coastFrames(COAST)
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const index: number[] = []
  const c = new THREE.Color()
  frames.forEach(({ p, nx, nz }, i) => {
    rows.forEach(([off, y, col], r) => {
      positions.push(p[0] + nx * off, y, p[1] + nz * off)
      c.set(col)
      colors.push(c.r, c.g, c.b)
      uvs.push(i * 0.8, r / (rows.length - 1))
    })
    if (i < frames.length - 1) {
      const n = rows.length
      for (let r = 0; r < n - 1; r++) {
        const a = i * n + r
        index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1)
      }
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** My Khe beach — PROJECTS. */
export function MyKheBeach() {
  return (
    <Landmark id="my-khe">
      <Sand />
      <Surf />
      <Palms items={layout.palms} />
      <Umbrellas />
      <Buildings items={BEACH_HUTS} />
      <BasketBoats />
    </Landmark>
  )
}

function Sand() {
  const geometry = useMemo(
    () =>
      coastStrip([
        [-4.2, 0.05, palette.sand],
        [-1.2, 0.06, palette.sand],
        [0.7, 0.04, palette.sand],
        [2.4, -0.42, palette.sandWet],
        [4.4, -0.95, palette.sandWet],
      ]),
    [],
  )
  const material = useMemo(
    () =>
      withSurfaceDetail(
        new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
        'sand',
      ),
    [],
  )
  return <mesh geometry={geometry} material={material} receiveShadow />
}

/** Foam that rolls up the sand and slides back, in a loop. */
function Surf() {
  const geometry = useMemo(
    () =>
      coastStrip([
        [1.7, WORLD.waterY + 0.07, '#ffffff'],
        [2.6, WORLD.waterY + 0.045, '#ffffff'],
        [3.8, WORLD.waterY + 0.035, '#ffffff'],
      ]),
    [],
  )
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: timeUniform, uColor: { value: new THREE.Color(palette.warmWhite) } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float wave = 0.5 + 0.5 * sin(uTime * 0.9 + vUv.x * 0.18);
            float front = mix(0.1, 0.85, wave);
            float a = smoothstep(front - 0.06, front, vUv.y) * (1.0 - smoothstep(front, front + 0.28, vUv.y));
            a += 0.35 * smoothstep(0.75, 1.0, sin(vUv.x * 2.3 + uTime * 0.6) * 0.5 + 0.5) * (1.0 - vUv.y);
            gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0) * 0.85);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )
  return <mesh geometry={geometry} material={material} renderOrder={1} />
}

/* ------------------------------------------------------------------------ */
/* Palms                                                                     */
/* ------------------------------------------------------------------------ */

const palmTrunk = (() => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, 0.9, 0),
    new THREE.Vector3(0.36, 1.8, 0),
  ])
  return new THREE.TubeGeometry(curve, 6, 0.07, 5)
})()

const palmFronds = (() => {
  const parts: THREE.BufferGeometry[] = []
  const n = 7
  for (let i = 0; i < n; i++) {
    const g = new THREE.ConeGeometry(0.16, 1.2, 3, 1)
    g.scale(1, 1, 0.25)
    g.translate(0, 0.6, 0)
    g.rotateZ(-1.95)
    g.rotateY((i / n) * Math.PI * 2)
    g.translate(0.36, 1.8, 0)
    parts.push(g)
  }
  const coco = new THREE.IcosahedronGeometry(0.11, 0)
  coco.translate(0.36, 1.72, 0)
  return mergeGeometries([...parts.map((p) => p.toNonIndexed()), coco])!
})()

export function Palms({ items }: { items: PalmInstance[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null)
  const fronds = useRef<THREE.InstancedMesh>(null)
  const frondMaterial = useMemo(() => createSwayMaterial('#7FB27A', 0.035), [])

  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    items.forEach((p, i) => {
      d.position.set(p.x, 0.03, p.z)
      d.rotation.set(0, p.rot, p.lean * 0.4)
      d.scale.setScalar(p.s)
      d.updateMatrix()
      trunks.current?.setMatrixAt(i, d.matrix)
      fronds.current?.setMatrixAt(i, d.matrix)
    })
    for (const m of [trunks.current, fronds.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [items])

  return (
    <group>
      <instancedMesh ref={trunks} args={[palmTrunk, undefined, items.length]} castShadow>
        <meshLambertMaterial color="#B58A62" flatShading />
      </instancedMesh>
      <instancedMesh ref={fronds} args={[palmFronds, frondMaterial, items.length]} castShadow />
    </group>
  )
}

/* ------------------------------------------------------------------------ */
/* Umbrellas, huts, basket boats                                             */
/* ------------------------------------------------------------------------ */

function Umbrellas() {
  const items = layout.umbrellas
  const canopy = useRef<THREE.InstancedMesh>(null)
  const poles = useRef<THREE.InstancedMesh>(null)
  const towels = useRef<THREE.InstancedMesh>(null)
  const canopyGeometry = useMemo(() => new THREE.ConeGeometry(0.5, 0.26, 8, 1, true), [])
  const poleGeometry = useMemo(() => new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), [])
  const towelGeometry = useMemo(() => new THREE.BoxGeometry(0.22, 0.02, 0.48), [])

  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((u, i) => {
      d.position.set(u.x, 0.75, u.z)
      d.rotation.set(u.tilt, 0, u.tilt * 0.6)
      d.scale.setScalar(1)
      d.updateMatrix()
      canopy.current?.setMatrixAt(i, d.matrix)
      canopy.current?.setColorAt(i, c.set(u.color))
      d.position.set(u.x, 0.4, u.z)
      d.rotation.set(u.tilt, 0, u.tilt * 0.6)
      d.updateMatrix()
      poles.current?.setMatrixAt(i, d.matrix)
      d.position.set(u.x + 0.32, 0.07, u.z + 0.05)
      d.rotation.set(0, u.tilt, 0)
      d.updateMatrix()
      towels.current?.setMatrixAt(i, d.matrix)
      towels.current?.setColorAt(i, c.set(i % 2 ? palette.warmWhite : palette.ocean))
    })
    for (const m of [canopy.current, poles.current, towels.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [items])

  return (
    <group>
      <instancedMesh ref={canopy} args={[canopyGeometry, undefined, items.length]} castShadow>
        <meshLambertMaterial side={THREE.DoubleSide} flatShading />
      </instancedMesh>
      <instancedMesh ref={poles} args={[poleGeometry, undefined, items.length]}>
        <meshLambertMaterial color={palette.warmWhite} />
      </instancedMesh>
      <instancedMesh ref={towels} args={[towelGeometry, undefined, items.length]} receiveShadow>
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  )
}

const BEACH_HUTS: Building[] = (() => {
  const frames = coastFrames(COAST)
  const r = rng(515)
  return [0.18, 0.34, 0.52, 0.68, 0.84]
    .map((u) => frames[Math.floor(u * (frames.length - 1))])
    .map(({ p, nx, nz }) => ({
      x: p[0] - nx * 2.3,
      z: p[1] - nz * 2.3 + (r() - 0.5),
      w: 0.9,
      d: 0.8,
      h: 0.55,
      rot: 0,
      wall: palette.wood,
      roof: '#E8C98F',
      roofKind: 'hip' as const,
      kind: 'house' as const,
      city: false,
    }))
})()

/** Round "thung chai" basket boats, bobbing just off the beach. */
function BasketBoats() {
  const hull = useRef<THREE.InstancedMesh>(null)
  const rim = useRef<THREE.InstancedMesh>(null)
  const boats = useMemo(() => {
    const frames = coastFrames(COAST)
    const r = rng(616)
    return Array.from({ length: 9 }, (_, i) => {
      const f = frames[Math.floor((0.12 + (i / 9) * 0.8) * (frames.length - 1))]
      const off = i % 3 === 0 ? -0.3 : 5 + r() * 4 // a few pulled up on the sand
      return {
        x: f.p[0] + f.nx * off,
        z: f.p[1] + f.nz * off + (r() - 0.5) * 1.5,
        y: off < 0 ? 0.2 : WORLD.waterY + 0.19,
        phase: r() * 6.28,
        floating: off > 0,
      }
    })
  }, [])
  const hullGeometry = useMemo(
    () => new THREE.SphereGeometry(0.34, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 0.55, 1),
    [],
  )
  const rimGeometry = useMemo(() => new THREE.TorusGeometry(0.34, 0.035, 5, 14).rotateX(Math.PI / 2), [])
  const d = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    boats.forEach((b, i) => {
      const bob = b.floating ? Math.sin(t * 1.6 + b.phase) * 0.04 : 0
      d.position.set(b.x, b.y + bob, b.z)
      d.rotation.set(
        b.floating ? Math.sin(t * 1.3 + b.phase) * 0.12 : 0.1,
        b.phase,
        b.floating ? Math.cos(t * 1.1 + b.phase) * 0.1 : 0,
      )
      d.updateMatrix()
      hull.current?.setMatrixAt(i, d.matrix)
      rim.current?.setMatrixAt(i, d.matrix)
    })
    if (hull.current) hull.current.instanceMatrix.needsUpdate = true
    if (rim.current) rim.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={hull} args={[hullGeometry, undefined, boats.length]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#6F8FA6" side={THREE.DoubleSide} flatShading />
      </instancedMesh>
      <instancedMesh ref={rim} args={[rimGeometry, undefined, boats.length]} frustumCulled={false}>
        <meshLambertMaterial color={palette.wood} />
      </instancedMesh>
    </group>
  )
}
