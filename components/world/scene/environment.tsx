'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { SUN_POSITION } from '@/lib/world/materials'

/**
 * Holder for the studio environment map. It is deliberately NOT the main
 * scene: since three r163 `scene.environment` also lights Lambert materials,
 * which washes the whole diorama out. Metals opt in by reading
 * `studioEnvironment.environment` into their own `envMap`.
 */
export const studioEnvironment = new THREE.Scene()

/** A glowing card: an unlit plane whose colour is pushed past 1.0 (HDR). */
function card(
  scene: THREE.Scene,
  color: string,
  intensity: number,
  position: THREE.Vector3,
  size: [number, number],
) {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material)
  mesh.position.copy(position)
  mesh.lookAt(0, 0, 0)
  scene.add(mesh)
}

/**
 * A soft "photo studio" environment, built from light cards in code and
 * rendered once into a PMREM cube: a warm key matching the sun, a pale sky
 * dome and a green ground bounce. Nothing is downloaded, and none of drei's
 * HDR/EXR loaders end up in the bundle. It is what the gilded dragon reflects.
 */
export function StudioEnvironment() {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#CFE6EE')
    const sun = SUN_POSITION.clone().normalize().multiplyScalar(10)
    card(scene, '#FFE3B8', 4, sun, [6, 6])
    card(scene, '#BFE3F2', 1.4, new THREE.Vector3(0, 10, 0), [24, 24])
    card(scene, '#A7CFA0', 0.6, new THREE.Vector3(0, -6, 0), [24, 24])
    card(scene, '#FFF4E0', 1.2, new THREE.Vector3(-10, 4, -8), [4, 4])

    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(scene, 0.04)
    studioEnvironment.environment = target.texture
    pmrem.dispose()
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        ;(o.material as THREE.Material).dispose()
      }
    })

    return () => {
      studioEnvironment.environment = null
      target.dispose()
    }
  }, [gl])

  return null
}
