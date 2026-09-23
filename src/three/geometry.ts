import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BRICK_H, SIZE_DIMS, type SizeKey } from '../lib/layout'

const SEAM = 0.012 // shaved off each side so neighbouring bricks read as separate pieces
const STUD_R = 0.3
const STUD_H = 0.18

let studCache: THREE.BufferGeometry | null = null
export function studGeometry(): THREE.BufferGeometry {
  if (studCache) return studCache
  const e = 0.035
  const pts = [new THREE.Vector2(STUD_R, 0), new THREE.Vector2(STUD_R, STUD_H - e)]
  for (let k = 1; k <= 3; k++) {
    const a = (k / 3) * (Math.PI / 2)
    pts.push(new THREE.Vector2(STUD_R - e + Math.cos(a) * e, STUD_H - e + Math.sin(a) * e))
  }
  pts.push(new THREE.Vector2(0.001, STUD_H))
  studCache = new THREE.LatheGeometry(pts, 18)
  return studCache
}

const brickCache = new Map<SizeKey, THREE.BufferGeometry>()

/** A brick with its origin at the centre of its underside. Long side runs along z. */
export function brickGeometry(size: SizeKey): THREE.BufferGeometry {
  const hit = brickCache.get(size)
  if (hit) return hit
  const [w, d] = SIZE_DIMS[size]
  const h = BRICK_H - SEAM
  const body = new RoundedBoxGeometry(w - SEAM * 2, h, d - SEAM * 2, 2, 0.045)
  body.translate(0, h / 2, 0)
  const parts: THREE.BufferGeometry[] = [body]
  for (let i = 0; i < w; i++)
    for (let j = 0; j < d; j++) {
      const s = studGeometry().clone()
      s.translate(i - (w - 1) / 2, h, j - (d - 1) / 2)
      parts.push(s)
    }
  // RoundedBoxGeometry has no index and LatheGeometry does; merge needs them alike.
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))
  g.computeBoundingBox()
  g.computeBoundingSphere()
  brickCache.set(size, g)
  return g
}

/** Paper sweep: a floor that curves up into a back wall, like a stop-motion set. */
export function sweepGeometry(width: number, floorY: number, frontZ: number, wallZ: number, radius: number, height: number) {
  const pts: [number, number][] = [] // (z, y) along the profile, front to top
  const steps = 24
  pts.push([frontZ, floorY])
  pts.push([wallZ + radius, floorY])
  for (let k = 1; k <= steps; k++) {
    const a = (k / steps) * (Math.PI / 2)
    pts.push([wallZ + radius - Math.sin(a) * radius, floorY + radius - Math.cos(a) * radius])
  }
  pts.push([wallZ, floorY + height])
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < pts.length; i++) {
    const [z, y] = pts[i]
    pos.push(-width / 2, y, z, width / 2, y, z)
    if (i > 0) {
      const a = (i - 1) * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function roundedSlab(w: number, h: number, d: number, r: number) {
  const g = new RoundedBoxGeometry(w, h, d, 3, r)
  return g
}
