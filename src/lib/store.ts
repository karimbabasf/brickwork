import { create } from 'zustand'
import { dayKey } from './days'
import type { SizeKey } from './layout'
import { demoData } from './demo'
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
}

interface Saved {
  v: 1
  goals: Goal[]
  bricks: Brick[]
  since: string | null // first day of building
  muted: boolean
}

export interface State extends Saved {
  demo: boolean
  editing: boolean // picking goals (first run, or the add button)
  viewDay: string | null // null: today, live
  hold: { goal: string; size: SizeKey; at: number } | null
  flying: string | null // brick id mid-drop; the towers leave it out until it lands
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
    const s = JSON.parse(raw) as Saved
    if (s?.v !== 1 || !Array.isArray(s.goals) || !Array.isArray(s.bricks)) return null
    s.bricks.sort((a, b) => a.t - b.t)
    return s
  } catch {
    return null
  }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage full or blocked: the session keeps working in memory
  }
}

export function createStore(initial: Saved | null, demo: boolean) {
  const base: Saved = initial ?? { v: 1, goals: [], bricks: [], since: null, muted: false }
  const store = create<State>()((set, get) => ({
    ...base,
    demo,
    editing: base.goals.length === 0 || (!demo && base.since === null),
    viewDay: null,
    hold: null,
    flying: null,
    lastDrop: null,
    film: false,
    inspect: null,

    toggleGoal: (presetKey) => {
      const { goals, bricks } = get()
      const existing = goals.find((g) => g.preset === presetKey)
      if (existing) {
        if (bricks.some((b) => b.goal === existing.id)) return // a goal with bricks stays
        set({ goals: goals.filter((g) => g !== existing) })
        return
      }
      if (goals.length >= MAX_GOALS) return
      const p = PRESETS.find((x) => x.key === presetKey)
      if (!p) return
      set({ goals: [...goals, { id: uid(), preset: p.key, name: p.name, color: p.color }] })
    },
    renameGoal: (id, name) => {
      const clean = name.replace(/\s+/g, ' ').trim().slice(0, 18)
      if (!clean) return
      set({ goals: get().goals.map((g) => (g.id === id ? { ...g, name: clean } : g)) })
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
      const { hold, bricks, since } = get()
      if (!hold) return null
      const brick: Brick = { id: uid(), goal: hold.goal, size: hold.size, t: Date.now() }
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
      const { lastDrop, bricks } = get()
      if (!lastDrop) return
      set({ bricks: bricks.filter((b) => b.id !== lastDrop.id), lastDrop: null, flying: null })
    },
    removeBrick: (id) => {
      const { bricks, lastDrop } = get()
      set({
        bricks: bricks.filter((b) => b.id !== id),
        inspect: null,
        lastDrop: lastDrop?.id === id ? null : lastDrop,
      })
    },
    setNote: (id, note) => {
      const clean = note.replace(/\s+/g, ' ').trim().slice(0, 80)
      set({ bricks: get().bricks.map((b) => (b.id === id ? { ...b, note: clean || undefined } : b)) })
    },
    setViewDay: (key) => {
      const today = dayKey(Date.now())
      set({ viewDay: key === today ? null : key, inspect: null })
    },
    setMuted: (m) => set({ muted: m }),
    setFilm: (on) => set({ film: on, hold: null, inspect: null, viewDay: on ? null : get().viewDay }),
    setInspect: (inspect) => set({ inspect }),
  }))

  if (!demo) {
    let prev = store.getState()
    store.subscribe((s) => {
      if (s.goals !== prev.goals || s.bricks !== prev.bricks || s.muted !== prev.muted || s.since !== prev.since) {
        save({ v: 1, goals: s.goals, bricks: s.bricks, since: s.since, muted: s.muted })
      }
      prev = s
    })
  }
  return store
}

export const isDemo = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')

export const useStore = createStore(isDemo ? demoData() : load(), isDemo)
