import { create } from 'zustand'
import { dayKey } from './days'
import { seatFor, withSeats } from './derive'
import type { Placement, SizeKey } from './layout'
import { sanitizeDoc, type LogDoc } from './logdoc'
import { MAX_GOALS, PRESETS } from './palette'

export interface Goal {
  id: string
  preset: string
  name: string
  color: string
}

export interface Brick {
  id: string
  goal: string
  size: SizeKey
  t: number
  note?: string
  at?: Placement // the seat it landed in; stored so a brick never moves
  e?: number // when the note last changed
}

interface Saved {
  v: 1
  goals: Goal[]
  bricks: Brick[]
  since: string | null // first day of building
  removed: string[] // bricks taken off
  goalsAt: number // when the goal list last changed
  muted: boolean
}

export interface State extends Saved {
  editing: boolean // picking goals (first run, or the add button)
  viewDay: string | null // null: today, live
  hold: { goal: string; size: SizeKey; at: number } | null
  flying: string | null // brick id mid-drop; the towers leave it out until it lands
  leaving: Brick | null // a brick just taken off, shown lifting out of its seat
  lastDrop: { id: string; at: number } | null
  film: boolean
  inspect: { id: string; x: number; y: number } | null

  toggleGoal: (preset: string) => void
  renameGoal: (id: string, name: string) => void
  setEditing: (on: boolean) => void
  beginHold: (goal: string) => void
  growHold: (size: SizeKey) => void
  cancelHold: () => void
  commitHold: () => Brick | null
  landed: (id: string) => void
  undoLast: () => void
  removeBrick: (id: string) => void
  left: () => void
  applyDoc: (doc: LogDoc) => void
  setNote: (id: string, note: string) => void
  setViewDay: (key: string | null) => void
  setMuted: (m: boolean) => void
  setFilm: (on: boolean) => void
  setInspect: (i: State['inspect']) => void
}

const KEY = 'brickwork.v1'

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { muted?: unknown }
    const doc = sanitizeDoc(parsed)
    return doc && { ...doc, muted: parsed.muted === true }
  } catch {
    return null
  }
}

export function toDoc(s: Saved): LogDoc {
  return { v: 1, goals: s.goals, bricks: s.bricks, removed: s.removed, since: s.since, goalsAt: s.goalsAt }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage full or blocked: the session keeps working in memory
  }
}

export function createStore(initial: Saved | null) {
  const base: Saved = initial ?? { v: 1, goals: [], bricks: [], since: null, removed: [], goalsAt: 0, muted: false }
  base.bricks = withSeats(base.goals, base.bricks)
  const store = create<State>()((set, get) => ({
    ...base,
    editing: base.goals.length === 0 || base.since === null,
    viewDay: null,
    hold: null,
    flying: null,
    leaving: null,
    lastDrop: null,
    film: false,
    inspect: null,

    toggleGoal: (presetKey) => {
      const { goals, bricks } = get()
      const existing = goals.find((g) => g.preset === presetKey)
      if (existing) {
        if (bricks.some((b) => b.goal === existing.id)) return // a goal with bricks stays
        set({ goals: goals.filter((g) => g !== existing), goalsAt: Date.now() })
        return
      }
      if (goals.length >= MAX_GOALS) return
      const p = PRESETS.find((x) => x.key === presetKey)
      if (!p) return
      set({ goals: [...goals, { id: uid(), preset: p.key, name: p.name, color: p.color }], goalsAt: Date.now() })
    },
    renameGoal: (id, name) => {
      const clean = name.replace(/\s+/g, ' ').trim().slice(0, 18)
      if (!clean) return
      const goal = get().goals.find((g) => g.id === id)
      if (!goal || goal.name === clean) return
      set({ goals: get().goals.map((g) => (g.id === id ? { ...g, name: clean } : g)), goalsAt: Date.now() })
    },
    setEditing: (on) => {
      if (!on && get().goals.length === 0) return
      set({ editing: on, since: get().since ?? (on ? null : dayKey(Date.now())) })
    },
    beginHold: (goal) => {
      const s = get()
      if (s.hold || s.film || s.flying) return
      set({ hold: { goal, size: 's', at: performance.now() }, viewDay: null, inspect: null })
    },
    growHold: (size) => {
      const h = get().hold
      if (h && h.size !== size) set({ hold: { ...h, size } })
    },
    cancelHold: () => set({ hold: null }),
    commitHold: () => {
      const { hold, bricks, since, goals } = get()
      if (!hold) return null
      const at = seatFor(goals, bricks, hold.goal, hold.size)
      const brick: Brick = { id: uid(), goal: hold.goal, size: hold.size, t: Date.now(), at }
      set({
        hold: null,
        bricks: [...bricks, brick],
        flying: brick.id,
        lastDrop: { id: brick.id, at: Date.now() },
        since: since ?? dayKey(brick.t),
      })
      return brick
    },
    landed: (id) => {
      if (get().flying === id) set({ flying: null })
    },
    undoLast: () => {
      const { lastDrop, bricks, flying } = get()
      if (!lastDrop) return
      const gone = bricks.find((b) => b.id === lastDrop.id) ?? null
      set({
        bricks: bricks.filter((b) => b.id !== lastDrop.id),
        removed: [...get().removed, lastDrop.id],
        lastDrop: null,
        flying: null,
        leaving: flying === lastDrop.id ? null : gone,
      })
    },
    removeBrick: (id) => {
      const { bricks, lastDrop } = get()
      set({
        bricks: bricks.filter((b) => b.id !== id),
        removed: [...get().removed, id],
        inspect: null,
        lastDrop: lastDrop?.id === id ? null : lastDrop,
        leaving: bricks.find((b) => b.id === id) ?? null,
      })
    },
    left: () => set({ leaving: null }),
    applyDoc: (doc) => {
      const s = get()
      const alive = new Set(doc.bricks.map((b) => b.id))
      set({
        goals: doc.goals,
        bricks: doc.bricks,
        removed: doc.removed,
        since: doc.since,
        goalsAt: doc.goalsAt,
        editing: s.editing && !(doc.goals.length > 0 && doc.since),
        flying: s.flying && alive.has(s.flying) ? s.flying : null,
        inspect: s.inspect && alive.has(s.inspect.id) ? s.inspect : null,
        lastDrop: s.lastDrop && alive.has(s.lastDrop.id) ? s.lastDrop : null,
      })
    },
    setNote: (id, note) => {
      const clean = note.replace(/\s+/g, ' ').trim().slice(0, 80)
      const b = get().bricks.find((x) => x.id === id)
      if (!b || (b.note ?? '') === clean) return
      set({ bricks: get().bricks.map((x) => (x.id === id ? { ...x, note: clean || undefined, e: Date.now() } : x)) })
    },
    setViewDay: (key) => {
      const today = dayKey(Date.now())
      set({ viewDay: key === today ? null : key, inspect: null })
    },
    setMuted: (m) => set({ muted: m }),
    setFilm: (on) => set({ film: on, hold: null, inspect: null, viewDay: on ? null : get().viewDay }),
    setInspect: (inspect) => set({ inspect }),
  }))

  let prev = store.getState()
  store.subscribe((s) => {
    if (s.goals !== prev.goals || s.bricks !== prev.bricks || s.muted !== prev.muted || s.since !== prev.since || s.removed !== prev.removed) {
      save({ ...toDoc(s), muted: s.muted })
    }
    prev = s
  })
  return store
}

export const useStore = createStore(load())
