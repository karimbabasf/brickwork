import { withSeats } from './derive.js'
import { validSeat, type SizeKey } from './layout.js'
import type { Brick, Goal } from './store.js'

/** Everything that syncs between devices. Sound on or off stays per device. */
export interface LogDoc {
  v: 1
  goals: Goal[]
  bricks: Brick[]
  removed: string[] // ids of bricks taken off, so another device cannot bring them back
  since: string | null
  goalsAt: number // when the goal list last changed
}

export const emptyDoc = (): LogDoc => ({ v: 1, goals: [], bricks: [], removed: [], since: null, goalsAt: 0 })

const MAX_GOALS = 12
const MAX_BRICKS = 50_000
const SIZES = new Set<string>(['s', 'm', 'l'])
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Rebuilds a log from untrusted JSON: known fields only, every value checked. */
export function sanitizeDoc(input: unknown): LogDoc | null {
  if (!input || typeof input !== 'object') return null
  const o = input as Record<string, unknown>
  if (o.v !== 1 || !Array.isArray(o.goals) || !Array.isArray(o.bricks)) return null

  const goals: Goal[] = []
  for (const g of o.goals.slice(0, MAX_GOALS)) {
    if (!g || typeof g !== 'object') continue
    const { id, preset, name, color } = g as Record<string, unknown>
    if (text(id, 64) && text(preset, 32) && text(name, 40) && typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
      goals.push({ id, preset, name, color })
  }

  const bricks: Brick[] = []
  for (const b of o.bricks.slice(0, MAX_BRICKS)) {
    if (!b || typeof b !== 'object') continue
    const { id, goal, size, t, note, e, at } = b as Record<string, unknown>
    if (!text(id, 64) || !text(goal, 64) || typeof size !== 'string' || !SIZES.has(size) || !num(t) || t < 0) continue
    const clean: Brick = { id, goal, size: size as SizeKey, t }
    if (typeof note === 'string' && note.trim()) clean.note = note.slice(0, 200)
    if (num(e)) clean.e = e
    if (validSeat(clean.size, at)) clean.at = { x: at.x, z: at.z, w: at.w, d: at.d, layer: at.layer }
    bricks.push(clean)
  }
  bricks.sort((a, b) => a.t - b.t)

  const removed = Array.isArray(o.removed) ? o.removed.filter((r): r is string => text(r, 64)).slice(-MAX_BRICKS) : []
  const since = typeof o.since === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.since) ? o.since : null
  return { v: 1, goals, bricks, removed, since, goalsAt: num(o.goalsAt) ? o.goalsAt : 0 }
}

/** Two copies of the log become one. Nothing logged on either side is lost. */
export function mergeDocs(a: LogDoc, b: LogDoc): LogDoc {
  const removed = [...new Set([...a.removed, ...b.removed])]
  const gone = new Set(removed)
  const byId = new Map<string, Brick>()
  for (const x of [...a.bricks, ...b.bricks]) {
    if (gone.has(x.id)) continue
    const have = byId.get(x.id)
    if (!have || (x.e ?? 0) > (have.e ?? 0)) byId.set(x.id, x)
  }
  const bricks = [...byId.values()].sort((p, q) => p.t - q.t || (p.id < q.id ? -1 : 1))

  const newer = b.goalsAt > a.goalsAt ? b : a
  const older = newer === a ? b : a
  const goals = [...newer.goals]
  const used = new Set(bricks.map((x) => x.goal))
  for (const g of older.goals) if (used.has(g.id) && !goals.some((x) => x.id === g.id)) goals.push(g)

  const since = [a.since, b.since].filter((d): d is string => !!d).sort()[0] ?? null
  return { v: 1, goals, bricks: withSeats(goals, bricks), removed, since, goalsAt: Math.max(a.goalsAt, b.goalsAt) }
}
