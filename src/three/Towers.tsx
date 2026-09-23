import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { GoalBuild } from '../lib/derive'
import { placementCenter, type SetLayout, type SizeKey } from '../lib/layout'
import { isMilestone } from '../lib/palette'
import { useStore } from '../lib/store'
import { useView } from '../lib/view'
import { brickGeometry } from './geometry'
import { goldPlastic, plastic } from './materials'

/** The selected day's bricks sit a hair above their seat, not yet pressed down. */
export const UNPRESSED = 0.12

const BUCKETS: { key: string; size: SizeKey; gold: boolean }[] = [
  { key: 's', size: 's', gold: false },
  { key: 'm', size: 'm', gold: false },
  { key: 'l', size: 'l', gold: false },
  { key: 'gs', size: 's', gold: true },
  { key: 'gm', size: 'm', gold: true },
  { key: 'gl', size: 'l', gold: true },
]

const TURN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
const STILL = new THREE.Quaternion()
const ONE = new THREE.Vector3(1, 1, 1)

export interface TowersProps {
  builds: Map<string, GoalBuild>
  layout: SetLayout
  counts: Record<string, number>
  raised: Record<string, [number, number]> // per goal, brick index range lifted
  lift: number // how far those bricks sit above their seats right now
}

export function Towers({ builds, layout, counts, raised, lift }: TowersProps) {
  return (
    <>
      {[...builds.values()].map((b) => (
        <GoalTower
          key={b.goal.id}
          build={b}
          plot={layout.plots[b.index]}
          count={counts[b.goal.id] ?? b.bricks.length}
          raised={raised[b.goal.id] ?? NONE}
          lift={lift}
        />
      ))}
    </>
  )
}

const NONE: [number, number] = [0, 0]

function GoalTower(props: { build: GoalBuild; plot: { x: number; z: number }; count: number; raised: [number, number]; lift: number }) {
  const { build, plot, count, raised, lift } = props
  const buckets = useMemo(() => {
    const map: Record<string, number[]> = { s: [], m: [], l: [], gs: [], gm: [], gl: [] }
    build.bricks.forEach((b, i) => map[(isMilestone(i) ? 'g' : '') + b.size].push(i))
    return map
  }, [build])
  if (!plot) return null
  return (
    <>
      {BUCKETS.map((b) =>
        buckets[b.key].length ? (
          <Bucket key={b.key} build={build} plot={plot} indices={buckets[b.key]} size={b.size} gold={b.gold} count={count} raised={raised} lift={lift} />
        ) : null,
      )}
    </>
  )
}

function countBelow(sorted: number[], limit: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < limit) lo = mid + 1
    else hi = mid
  }
  return lo
}

interface BucketProps {
  build: GoalBuild
  plot: { x: number; z: number }
  indices: number[]
  size: SizeKey
  gold: boolean
  count: number
  raised: [number, number]
  lift: number
}

function Bucket({ build, plot, indices, size, gold, count, raised, lift }: BucketProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const capacity = Math.max(8, 2 ** Math.ceil(Math.log2(indices.length + 1)))
  const material = gold ? goldPlastic() : plastic(build.goal.color)
  const [r0, r1] = raised

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    indices.forEach((bi, k) => {
      const c = placementCenter(build.placements[bi], plot)
      p.set(c.x, c.y + (bi >= r0 && bi < r1 ? lift : 0), c.z)
      m.compose(p, c.rotated ? TURN : STILL, ONE)
      mesh.setMatrixAt(k, m)
    })
    mesh.count = indices.length
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere() // over every brick, so picking works while the film hides some
    mesh.count = countBelow(indices, count)
    invalidate()
  }, [indices, build, plot, r0, r1, lift, capacity, count, invalidate])

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (e.instanceId === undefined) return null
    const bi = indices[e.instanceId]
    return bi === undefined ? null : build.bricks[bi]
  }

  return (
    <instancedMesh
      key={capacity}
      ref={ref}
      args={[brickGeometry(size), material, capacity]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onPointerMove={(e) => {
        e.stopPropagation()
        const b = pick(e)
        if (b) useView.getState().set({ hover: { id: b.id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } })
      }}
      onPointerOut={() => useView.getState().set({ hover: null })}
      onClick={(e) => {
        e.stopPropagation()
        const b = pick(e)
        if (b) useStore.getState().setInspect({ id: b.id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
      }}
    />
  )
}

/** Top of each tower (in layers) after its first n bricks, for framing the camera. */
export function towerTops(build: GoalBuild): Int32Array {
  const tops = new Int32Array(build.placements.length + 1)
  for (let i = 0; i < build.placements.length; i++) tops[i + 1] = Math.max(tops[i], build.placements[i].layer + 1)
  return tops
}
