import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FOOT, LABEL_DEPTH, type SetLayout } from '../lib/layout'
import { roundedSlab, studGeometry, sweepGeometry } from './geometry'
import { plastic } from './materials'

export const PLINTH_H = 1.2

export function Sweep({ color }: { color: string }) {
  const geo = useMemo(() => sweepGeometry(1200, -PLINTH_H, 420, -110, 70, 520), [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  )
}

export function Plinth({ layout, color }: { layout: SetLayout; color: string }) {
  const w = layout.maxX - layout.minX
  const d = layout.maxZ - layout.minZ
  const slab = useMemo(() => roundedSlab(w, PLINTH_H, d, 0.28), [w, d])
  const studs = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const count = w * d

  useLayoutEffect(() => {
    const mesh = studs.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    let k = 0
    for (let i = 0; i < w; i++)
      for (let j = 0; j < d; j++) {
        m.makeTranslation(layout.minX + i + 0.5, 0, layout.minZ + j + 0.5)
        mesh.setMatrixAt(k++, m)
      }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    invalidate()
  }, [layout, w, d, invalidate])

  return (
    <group>
      <mesh
        geometry={slab}
        material={plastic(color)}
        position={[(layout.minX + layout.maxX) / 2, -PLINTH_H / 2, (layout.minZ + layout.maxZ) / 2]}
        receiveShadow
        castShadow
      />
      <instancedMesh key={count} ref={studs} args={[studGeometry(), plastic(color), count]} receiveShadow castShadow />
    </group>
  )
}

const TILE_H = 0.4
let tileGeo: THREE.BufferGeometry | null = null

function drawLabel(canvas: HTMLCanvasElement, name: string, count: number, ink: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: W, height: H } = canvas
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = ink
  ctx.textBaseline = 'middle'
  ctx.font = '640 60px "Google Sans Flex Variable", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(name, 30, H / 2 + 3)
  ctx.font = '480 56px "Google Sans Flex Variable", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(String(count), W - 30, H / 2 + 3)
}

/** A printed 1x6 tile in front of each plot: the goal's name and its running count. */
export function LabelTile(props: { plot: { x: number; z: number }; name: string; count: number; tile: string; ink: string }) {
  const { plot, name, count, tile, ink } = props
  tileGeo ??= roundedSlab(FOOT - 0.03, TILE_H, LABEL_DEPTH - 0.03, 0.05)
  const invalidate = useThree((s) => s.invalidate)
  const [canvas, texture] = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 768
    c.height = 128
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return [c, t] as const
  }, [])

  useEffect(() => {
    let alive = true
    const paint = () => {
      if (!alive) return
      drawLabel(canvas, name, count, ink)
      texture.needsUpdate = true
      invalidate()
    }
    paint()
    document.fonts.load('640 60px "Google Sans Flex Variable"').then(paint, paint)
    return () => {
      alive = false
    }
  }, [canvas, texture, name, count, ink, invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={[plot.x + FOOT / 2, 0, plot.z + FOOT + LABEL_DEPTH / 2]}>
      <mesh geometry={tileGeo} material={plastic(tile)} position={[0, TILE_H / 2, 0]} castShadow receiveShadow />
      <mesh position={[0, TILE_H + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FOOT - 0.12, LABEL_DEPTH - 0.12]} />
        <meshStandardMaterial map={texture} transparent roughness={0.5} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}
