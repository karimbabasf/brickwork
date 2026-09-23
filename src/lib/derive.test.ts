import { describe, expect, it } from 'vitest'
import { buildTowers, seatFor, withSeats } from './derive'
import type { SizeKey } from './layout'
import type { Brick, Goal } from './store'

const goals: Goal[] = [{ id: 'g', preset: 'build', name: 'Build', color: '#c91a09' }]
const SIZES: SizeKey[] = ['s', 'm', 'l', 's', 's', 'm']

/** Adds bricks the way the app does: each one takes its seat when it lands. */
function stack(n: number): Brick[] {
  let bricks: Brick[] = []
  for (let i = 0; i < n; i++) {
    const size = SIZES[i % SIZES.length]
    bricks = [...bricks, { id: `b${i}`, goal: 'g', size, t: 1_000 + i, at: seatFor(goals, bricks, 'g', size) }]
  }
  return bricks
}

function seats(bricks: Brick[]) {
  const g = buildTowers(goals, bricks).get('g')!
  return new Map(g.bricks.map((b, i) => [b.id, g.placements[i]]))
}

describe('seats', () => {
  it('taking a brick off leaves every other brick exactly where it was', () => {
    const bricks = stack(40)
    const before = seats(bricks)
    const after = seats(bricks.filter((b) => b.id !== 'b12'))
    expect(after.size).toBe(39)
    for (const [id, seat] of after) expect(seat).toEqual(before.get(id))
  })

  it('a new brick lands where the held preview showed it', () => {
    const bricks = stack(10)
    const preview = buildTowers(goals, bricks).get('g')!.tower.next('l')
    expect(seatFor(goals, bricks, 'g', 'l')).toEqual(preview)
  })

  it('gives old saved bricks a seat once, in the order they were logged', () => {
    const legacy = stack(12).map(({ at: _at, ...b }) => b)
    const seated = withSeats(goals, legacy)
    expect(seated.every((b) => b.at)).toBe(true)
    expect(seats(seated)).toEqual(seats(stack(12)))
  })

  it('ignores a stored seat that could not be real and places the brick again', () => {
    const bricks = stack(3)
    const broken = [...bricks, { id: 'x', goal: 'g', size: 'l' as SizeKey, t: 9_999, at: { x: 7, z: 7, w: 4, d: 2, layer: 0 } }]
    const g = buildTowers(goals, broken).get('g')!
    const p = g.placements[3]
    expect(p.x + p.w).toBeLessThanOrEqual(8)
    expect(p.z + p.d).toBeLessThanOrEqual(8)
  })
})
