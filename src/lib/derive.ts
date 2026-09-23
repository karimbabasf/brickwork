import { dayKey, nextDayStart } from './days'
import { Tower, type Placement } from './layout'
import type { Brick, Goal } from './store'

export interface GoalBuild {
  goal: Goal
  index: number
  bricks: Brick[] // this goal's bricks, oldest first
  placements: Placement[] // parallel to bricks
  tower: Tower // state after every brick, for placing the next one
}

let memo: { goals: Goal[]; bricks: Brick[]; out: Map<string, GoalBuild> } | null = null

export function buildTowers(goals: Goal[], bricks: Brick[]): Map<string, GoalBuild> {
  if (memo && memo.goals === goals && memo.bricks === bricks) return memo.out
  const out = new Map<string, GoalBuild>()
  goals.forEach((goal, index) => out.set(goal.id, { goal, index, bricks: [], placements: [], tower: new Tower(goal.id) }))
  for (const b of bricks) {
    const g = out.get(b.goal)
    if (!g) continue
    g.bricks.push(b)
    g.placements.push(g.tower.push(b.size))
  }
  memo = { goals, bricks, out }
  return out
}

/** How many of each goal's bricks exist by the end of a day (or all of them). */
export function countsAt(builds: Map<string, GoalBuild>, day: string | null): Record<string, number> {
  const out: Record<string, number> = {}
  const until = day ? nextDayStart(day) : Infinity
  for (const [id, g] of builds) {
    let lo = 0
    let hi = g.bricks.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (g.bricks[mid].t < until) lo = mid + 1
      else hi = mid
    }
    out[id] = lo
  }
  return out
}

/** Counts after the first k bricks overall (the film). */
export function countsAfter(builds: Map<string, GoalBuild>, bricks: Brick[], k: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of builds.keys()) out[id] = 0
  for (let i = 0; i < k && i < bricks.length; i++) {
    const id = bricks[i].goal
    if (id in out) out[id]++
  }
  return out
}

export function bricksOnDay(bricks: Brick[], day: string): Brick[] {
  return bricks.filter((b) => dayKey(b.t) === day)
}

export function bricksByDay(bricks: Brick[]): Map<string, Brick[]> {
  const m = new Map<string, Brick[]>()
  for (const b of bricks) {
    const k = dayKey(b.t)
    const list = m.get(k)
    if (list) list.push(b)
    else m.set(k, [b])
  }
  return m
}
