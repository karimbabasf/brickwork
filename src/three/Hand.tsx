import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { pluck, snap } from '../lib/audio'
import type { GoalBuild } from '../lib/derive'
import { placementCenter, type Placement, type SetLayout, type SizeKey } from '../lib/layout'
import { useStore } from '../lib/store'
import { FRAME_MS, useView } from '../lib/view'
import { brickGeometry } from './geometry'
import { plastic } from './materials'
import { UNPRESSED } from './Towers'

/** How high the animator holds a brick above its seat. */
export const HOVER = 2.6

type Pose = readonly [lift: number, tiltX: number, tiltZ: number]

// The drop, one pose per 12 fps frame: yanked up, a beat of hang time, a tumbling
// fall, a hard press into the studs, one bounce, then it settles.
const DROP: Pose[] = [
  [HOVER, 0, 0],
  [HOVER + 1.8, 0.12, -0.08],
  [HOVER + 2.5, -0.06, 0.1],
  [HOVER + 2.0, 0.16, 0.05],
  [3.1, -0.12, -0.08],
  [1.2, 0.06, 0.04],
  [-0.14, 0, 0],
  [0.62, 0.03, -0.02],
  [0.16, 0, 0],
  [UNPRESSED, 0, 0],
]
const CONTACT = 6
// The two frames after contact are lit up, the way an animator shoots an impact frame.
const FLASH: Record<number, number> = { 6: 0.95, 7: 0.35 }

// Taking a brick off: it pops out of its seat and is lifted away.
const PLUCK: Pose[] = [
  [UNPRESSED + 0.3, 0, 0],
  [0.9, 0.06, -0.05],
  [1.9, -0.1, 0.08],
  [3.3, 0.14, -0.1],
  [5.2, -0.18, 0.14],
]

const WEIGHT: Record<SizeKey, number> = { s: 0.75, m: 1, l: 1.35 }

function seatOf(builds: Map<string, GoalBuild>, layout: SetLayout, goal: string, at: Placement | undefined) {
  const b = builds.get(goal)
  const plot = b && layout.plots[b.index]
  if (!b || !plot || !at) return null
  return { c: placementCenter(at, plot), color: b.goal.color }
}

const flashes = new Map<string, THREE.MeshPhysicalMaterial>()
function flashed(color: string, amount: number) {
  const key = `${color}:${amount}`
  let m = flashes.get(key)
  if (!m) {
    m = plastic(color).clone()
    m.emissive = new THREE.Color(color).lerp(new THREE.Color('#fff6e8'), 0.55)
    m.emissiveIntensity = amount
    flashes.set(key, m)
  }
  return m
}

function PosedBrick(props: { size: SizeKey; color: string; c: ReturnType<typeof placementCenter>; pose: Pose; flash?: number }) {
  const { size, color, c, pose, flash } = props
  return (
    <mesh
      geometry={brickGeometry(size)}
      material={flash ? flashed(color, flash) : plastic(color)}
      position={[c.x, c.y + pose[0], c.z]}
      rotation={[pose[1], c.rotated ? Math.PI / 2 : 0, pose[2]]}
      castShadow
      receiveShadow
    />
  )
}

/** Runs a pose sequence at 12 fps and reports each frame. */
function useFrames(key: string | null, length: number, onFrame: (f: number) => void, onDone: () => void) {
  const [frame, setFrame] = useState(0)
  const invalidate = useThree((s) => s.invalidate)
  const handlers = useRef({ onFrame, onDone })
  handlers.current = { onFrame, onDone }
  useEffect(() => {
    if (!key) return
    let f = 0
    setFrame(0)
    handlers.current.onFrame(0)
    const id = window.setInterval(() => {
      f++
      if (f >= length) {
        window.clearInterval(id)
        handlers.current.onDone()
        return
      }
      setFrame(f)
      handlers.current.onFrame(f)
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [key, length])
  useEffect(() => invalidate(), [frame, key, invalidate])
  return frame
}

/** The brick in the animator's fingers while a pad is held; it grows in steps. */
export function HeldBrick({ builds, layout }: { builds: Map<string, GoalBuild>; layout: SetLayout }) {
  const hold = useStore((s) => s.hold)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [hold, invalidate])
  if (!hold) return null
  const b = builds.get(hold.goal)
  const seat = b && seatOf(builds, layout, hold.goal, b.tower.next(hold.size))
  if (!seat) return null
  return <PosedBrick size={hold.size} color={seat.color} c={seat.c} pose={[HOVER, 0, 0]} />
}

/** The brick that was just let go, landing in ten stop-motion frames. */
export function FlyingBrick({ builds, layout }: { builds: Map<string, GoalBuild>; layout: SetLayout }) {
  const flying = useStore((s) => s.flying)
  const landed = useStore((s) => s.landed)
  const brick = useStore((s) => (s.flying ? s.bricks.find((b) => b.id === s.flying) : undefined))
  const seat = brick ? seatOf(builds, layout, brick.goal, brick.at) : null
  const frame = useFrames(
    flying,
    DROP.length,
    (f) => {
      if (f !== CONTACT || !brick || !seat) return
      snap(WEIGHT[brick.size])
      const v = useView.getState()
      const [w, d] = brick.at ? [brick.at.w, brick.at.d] : [2, 2]
      v.set({ bump: v.bump + 1, puff: { x: seat.c.x, y: seat.c.y, z: seat.c.z, w, d, n: v.bump + 1 } })
    },
    () => flying && landed(flying),
  )
  if (!flying || !brick || !seat) return null
  return <PosedBrick size={brick.size} color={seat.color} c={seat.c} pose={DROP[Math.min(frame, DROP.length - 1)]} flash={FLASH[frame]} />
}

/** A brick taken off lifts out of its seat, so you see exactly which one left. */
export function LeavingBrick({ builds, layout }: { builds: Map<string, GoalBuild>; layout: SetLayout }) {
  const leaving = useStore((s) => s.leaving)
  const left = useStore((s) => s.left)
  const seat = leaving ? seatOf(builds, layout, leaving.goal, leaving.at) : null
  const frame = useFrames(
    leaving?.id ?? null,
    PLUCK.length,
    (f) => f === 0 && pluck(),
    () => left(),
  )
  if (!leaving || !seat) return null
  return <PosedBrick size={leaving.size} color={seat.color} c={seat.c} pose={PLUCK[Math.min(frame, PLUCK.length - 1)]} />
}

const PUFF_N = 22
const PUFF_FRAMES = 7

/** A little cloud of dust where a brick hits: cotton-wool puffs, stepped like stop motion. */
export function Dust() {
  const puff = useView((s) => s.puff)
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [frame, setFrame] = useState(-1)
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.22, 1), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe9dd', roughness: 1, transparent: true, depthWrite: false }), [])

  // Directions around the brick's footprint, fixed per puff.
  const seeds = useMemo(() => {
    if (!puff) return []
    return Array.from({ length: PUFF_N }, (_, i) => {
      const a = (i / PUFF_N) * Math.PI * 2 + ((puff.n * 7 + i * 13) % 10) * 0.05
      const edge = { x: Math.cos(a) * (puff.w / 2 + 0.1), z: Math.sin(a) * (puff.d / 2 + 0.1) }
      return { a, edge, speed: 0.38 + ((i * 37 + puff.n) % 7) * 0.05, size: 0.75 + ((i * 11) % 5) * 0.16 }
    })
  }, [puff])

  useEffect(() => {
    if (!puff) return
    let f = 0
    setFrame(0)
    const id = window.setInterval(() => {
      f++
      if (f >= PUFF_FRAMES) {
        window.clearInterval(id)
        setFrame(-1)
        return
      }
      setFrame(f)
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [puff])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh || !puff || frame < 0) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    seeds.forEach((d, i) => {
      const out = 0.15 + frame * d.speed
      p.set(puff.x + d.edge.x + Math.cos(d.a) * out, puff.y + 0.1 + frame * 0.24 - frame * frame * 0.022, puff.z + d.edge.z + Math.sin(d.a) * out)
      const k = d.size * (1 + frame * 0.3) * (frame >= PUFF_FRAMES - 1 ? 0.55 : 1)
      s.set(k, k * 0.8, k)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mat.opacity = 0.95 - frame * 0.13
    invalidate()
  }, [frame, puff, seeds, mat, invalidate])

  if (!puff || frame < 0) return null
  return <instancedMesh ref={ref} args={[geo, mat, PUFF_N]} frustumCulled={false} />
}
