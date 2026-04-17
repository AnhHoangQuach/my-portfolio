'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

function FloatingShape({
  position,
  rotation,
  scale,
  geometry,
  speed,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  geometry: 'octahedron' | 'tetrahedron' | 'icosahedron' | 'torus'
  speed: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * speed * 0.3
    meshRef.current.rotation.y += delta * speed * 0.2
  })

  const geo = useMemo(() => {
    switch (geometry) {
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />
      case 'tetrahedron':
        return <tetrahedronGeometry args={[1, 0]} />
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />
      case 'torus':
        return <torusGeometry args={[1, 0.4, 8, 16]} />
    }
  }, [geometry])

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        {geo}
        <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.15} />
      </mesh>
    </Float>
  )
}

function Scene() {
  const shapes = useMemo(
    () => [
      {
        position: [-4, 2, -2] as [number, number, number],
        rotation: [0.5, 0.3, 0] as [number, number, number],
        scale: 0.8,
        geometry: 'octahedron' as const,
        speed: 1.5,
      },
      {
        position: [4, -1, -3] as [number, number, number],
        rotation: [0.2, 0.8, 0] as [number, number, number],
        scale: 1.2,
        geometry: 'icosahedron' as const,
        speed: 1,
      },
      {
        position: [-3, -2, -1] as [number, number, number],
        rotation: [0.7, 0.1, 0.3] as [number, number, number],
        scale: 0.6,
        geometry: 'tetrahedron' as const,
        speed: 2,
      },
      {
        position: [3, 2.5, -2] as [number, number, number],
        rotation: [0.1, 0.5, 0.2] as [number, number, number],
        scale: 0.5,
        geometry: 'torus' as const,
        speed: 1.2,
      },
      {
        position: [0, -3, -4] as [number, number, number],
        rotation: [0.4, 0.6, 0.1] as [number, number, number],
        scale: 0.7,
        geometry: 'octahedron' as const,
        speed: 0.8,
      },
    ],
    [],
  )

  return (
    <>
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} />
      ))}
    </>
  )
}

export function FloatingShapes({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        resize={{ debounce: 200 }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
