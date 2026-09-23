import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { snap } from '../lib/audio'
import type { GoalBuild } from '../lib/derive'
import { placementCenter, type SetLayout } from '../lib/layout'
import { useStore } from '../lib/store'
import { FRAME_MS } from '../lib/view'
import { brickGeometry } from './geometry'
import { plastic } from './materials'
import { UNPRESSED } from './Towers'

/** How high the animator holds a brick above its seat. */
export const HOVER = 2.6

// The drop, one pose per 12 fps frame: in the hand, falling, just above, pressed, released.
const DROP = [HOVER, 1.3, 0.38, -0.06, UNPRESSED]
const CONTACT_FRAME = 3

/** The brick in the animator's fingers while a pad is held; it grows in steps. */
export function HeldBrick({ builds, layout }: { builds: Map<string, GoalBuild>; layout: SetLayout }) {
  const hold = useStore((s) => s.hold)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [hold, invalidate])
  if (!hold) return null
  const b = builds.get(hold.goal)
  const plot = b && layout.plots[b.index]
  if (!b || !plot) return null
  const c = placementCenter(b.tower.next(hold.size), plot)
  return (
    <mesh
      geometry={brickGeometry(hold.size)}
      material={plastic(b.goal.color)}
      position={[c.x, c.y + HOVER, c.z]}
      rotation={[0, c.rotated ? Math.PI / 2 : 0, 0]}
      castShadow
    />
  )
}

/** The brick that was just let go: four stop-motion frames down to its seat. */
export function FlyingBrick({ builds, layout }: { builds: Map<string, GoalBuild>; layout: SetLayout }) {
  const flying = useStore((s) => s.flying)
  const landed = useStore((s) => s.landed)
  const invalidate = useThree((s) => s.invalidate)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!flying) return
    let f = 0
    setFrame(0)
    const id = window.setInterval(() => {
      f++
      if (f === CONTACT_FRAME) snap()
      if (f >= DROP.length) {
        window.clearInterval(id)
        landed(flying)
        return
      }
      setFrame(f)
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [flying, landed])

  useEffect(() => invalidate(), [frame, flying, invalidate])

  if (!flying) return null
  for (const b of builds.values()) {
    const i = b.bricks.findIndex((x) => x.id === flying)
    if (i < 0) continue
    const plot = layout.plots[b.index]
    if (!plot) return null
    const c = placementCenter(b.placements[i], plot)
    return (
      <mesh
        geometry={brickGeometry(b.bricks[i].size)}
        material={plastic(b.goal.color)}
        position={[c.x, c.y + DROP[Math.min(frame, DROP.length - 1)], c.z]}
        rotation={[0, c.rotated ? Math.PI / 2 : 0, 0]}
        castShadow
        receiveShadow
      />
    )
  }
  return null
}
