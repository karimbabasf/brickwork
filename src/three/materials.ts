import * as THREE from 'three'
import { GOLD } from '../lib/palette'

const cache = new Map<string, THREE.MeshPhysicalMaterial>()

/** ABS plastic: a soft sheen over a clear coat, like a new brick under a softbox. */
export function plastic(color: string): THREE.MeshPhysicalMaterial {
  const hit = cache.get(color)
  if (hit) return hit
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    specularIntensity: 0.7,
  })
  cache.set(color, m)
  return m
}

let gold: THREE.MeshPhysicalMaterial | null = null
export function goldPlastic(): THREE.MeshPhysicalMaterial {
  // Pearl gold, not chrome: a full metal reflects the dark studio and reads as a hole.
  gold ??= new THREE.MeshPhysicalMaterial({
    color: GOLD,
    roughness: 0.3,
    metalness: 0.3,
    envMapIntensity: 1.6,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
  })
  return gold
}
