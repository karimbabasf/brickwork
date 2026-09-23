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
  // Lacquered gold: amber, glossy and faintly self-lit. Metal reflects the dark studio
  // and turns to olive or reads as a hole; this stays gold in either light.
  gold ??= new THREE.MeshPhysicalMaterial({
    color: GOLD,
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    emissive: '#3a2600',
    emissiveIntensity: 0.25,
  })
  return gold
}
