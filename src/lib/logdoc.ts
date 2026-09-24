import { validSeat, type SizeKey } from './layout.js'
import type { Brick, Goal } from './store.js'

/** The saved log, as stored in the browser. */
export interface LogDoc {
  v: 1
  goals: Goal[]
  bricks: Brick[]
  removed: string[] // ids of bricks taken off
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
