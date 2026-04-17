'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 80
const CONNECTION_DISTANCE = 2.5
const MOUSE_RADIUS = 3

// Reusable temp vector to avoid per-frame allocations
const _mouseWorld = new THREE.Vector3()

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const mouse = useRef(new THREE.Vector2(9999, 9999))
  const { viewport } = useThree()

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Listen to pointer on window so interaction works even with pointer-events-none wrapper
  useEffect(() => {
    function onMove(e: PointerEvent) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.002,
        ),
        scale: 0.02 + Math.random() * 0.03,
      })
    }
    return arr
  }, [])

  const lineGeometry = useMemo(() => {
    // Max possible connections: n*(n-1)/2, but most won't connect. Cap at ~500.
    const maxLines = 500
    const positions = new Float32Array(maxLines * 6)
    const colors = new Float32Array(maxLines * 6)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setDrawRange(0, 0)
    return geometry
  }, [])

  useFrame(() => {
    if (!meshRef.current || !linesRef.current) return

    _mouseWorld.set(
      mouse.current.x * viewport.width * 0.5,
      mouse.current.y * viewport.height * 0.5,
      0,
    )

    // Update particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      p.position.add(p.velocity)

      // Boundary bounce
      if (Math.abs(p.position.x) > 6) p.velocity.x *= -1
      if (Math.abs(p.position.y) > 4) p.velocity.y *= -1
      if (Math.abs(p.position.z) > 2) p.velocity.z *= -1

      // Mouse repulsion
      const dx = p.position.x - _mouseWorld.x
      const dy = p.position.y - _mouseWorld.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MOUSE_RADIUS && dist > 0.01) {
        const force = (MOUSE_RADIUS - dist) * 0.0008
        p.velocity.x += (dx / dist) * force
        p.velocity.y += (dy / dist) * force
      }

      // Damping
      p.velocity.multiplyScalar(0.999)

      dummy.position.copy(p.position)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    // Update connections
    const positions = lineGeometry.attributes.position.array as Float32Array
    const colors = lineGeometry.attributes.color.array as Float32Array
    let lineIndex = 0
    const maxLines = 500

    outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dist = particles[i].position.distanceTo(particles[j].position)
        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE
          const idx = lineIndex * 6

          positions[idx] = particles[i].position.x
          positions[idx + 1] = particles[i].position.y
          positions[idx + 2] = particles[i].position.z
          positions[idx + 3] = particles[j].position.x
          positions[idx + 4] = particles[j].position.y
          positions[idx + 5] = particles[j].position.z

          // Primary color tint (blue-ish)
          const c = alpha * 0.3
          colors[idx] = c * 0.4
          colors[idx + 1] = c * 0.5
          colors[idx + 2] = c
          colors[idx + 3] = c * 0.4
          colors[idx + 4] = c * 0.5
          colors[idx + 5] = c

          lineIndex++
          if (lineIndex >= maxLines) break outer
        }
      }
    }

    lineGeometry.setDrawRange(0, lineIndex * 2)
    lineGeometry.attributes.position.needsUpdate = true
    lineGeometry.attributes.color.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

export function ParticleNetwork({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        resize={{ debounce: 200 }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
