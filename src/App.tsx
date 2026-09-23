import { useEffect, useMemo, useRef, useState } from 'react'
import { note, setMuted, tick } from './lib/audio'
import { addDays, dayKey, dayStart, daysBetween, nextDayStart } from './lib/days'
import { buildTowers, countsAfter, countsAt, type GoalBuild } from './lib/derive'
import { filmFrames } from './lib/film'
import { BRICK_H, setLayout } from './lib/layout'
import { MAX_GOALS } from './lib/palette'
import { useMood } from './lib/theme'
import { useStore } from './lib/store'
import { FRAME_MS, useView } from './lib/view'
import { Stage } from './three/Stage'
import { towerTops, UNPRESSED } from './three/Towers'
import { DayPanel } from './ui/DayPanel'
import { DayStrip } from './ui/DayStrip'
import { Dock } from './ui/Dock'
import { FilmFrame } from './ui/FilmFrame'
import { Inspector, Tooltip } from './ui/Hover'
import { Picker } from './ui/Picker'
import { TopBar } from './ui/TopBar'

function useToday() {
  const [today, setToday] = useState(() => dayKey(Date.now()))
  useEffect(() => {
    const id = window.setInterval(() => setToday(dayKey(Date.now())), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return today
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

/** Counts move toward their target one 12 fps frame at a time, so a jump in time plays as stop motion. */
function useSteppedCounts(target: Record<string, number>, animate: boolean) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(shown)
  useEffect(() => {
    const from = shownRef.current
    let diff = 0
    for (const k of Object.keys(target)) diff = Math.max(diff, Math.abs(target[k] - (from[k] ?? target[k])))
    if (!animate || diff <= 1) {
      shownRef.current = target
      setShown(target)
      return
    }
    const frames = Math.min(10, diff)
    let f = 0
    const id = window.setInterval(() => {
      f++
      const next: Record<string, number> = {}
      for (const k of Object.keys(target)) {
        const a = from[k] ?? target[k]
        next[k] = Math.round(a + (target[k] - a) * (f / frames))
      }
      shownRef.current = next
      setShown(next)
      if (f >= frames) window.clearInterval(id)
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [target, animate])
  return shown
}

// The shown day's bricks hop once when you land on that day, so the eye finds them.
const HOP = [0.3, 0.62, 0.78, 0.62, 0.3, 0.04]

function useHop(trigger: string): number {
  const [f, setF] = useState(-1)
  useEffect(() => {
    let i = -1
    let id = 0
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++
        if (i >= HOP.length) {
          window.clearInterval(id)
          setF(-1)
          return
        }
        setF(i)
      }, FRAME_MS)
    }, 600)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(id)
    }
  }, [trigger])
  return f < 0 ? 0 : HOP[f]
}

function useHoldGrowth() {
  const holding = useStore((s) => s.hold?.goal ?? null)
  useEffect(() => {
    if (!holding) return
    const a = window.setTimeout(() => {
      useStore.getState().growHold('m')
      tick()
    }, 380)
    const b = window.setTimeout(() => {
      useStore.getState().growHold('l')
      tick()
    }, 860)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [holding])
}

function useFilm(builds: Map<string, GoalBuild>, today: string, setK: (k: number) => void) {
  const film = useStore((s) => s.film)
  useEffect(() => {
    if (!film) return
    const { bricks, since, goals } = useStore.getState()
    const frames = filmFrames(bricks, since ?? today, today)
    const voice = new Map(goals.map((g, i) => [g.id, i]))
    let i = 0
    let prevK = 0
    const step = () => {
      if (i >= frames.length) {
        useStore.getState().setFilm(false)
        return
      }
      const fr = frames[i]
      const heard = new Set<string>()
      for (let j = prevK; j < fr.k; j++) {
        const b = bricks[j]
        if (heard.has(b.goal)) continue
        heard.add(b.goal)
        note(voice.get(b.goal) ?? 0, b.size)
      }
      prevK = fr.k
      setK(fr.k)
      useView.getState().set({ filmFrame: i, filmDay: fr.day })
      i++
    }
    useView.getState().set({ userMoved: false, hover: null })
    step()
    const id = window.setInterval(step, FRAME_MS)
    return () => {
      window.clearInterval(id)
      setK(0)
      const v = useView.getState()
      v.set({ filmFrame: 0, filmDay: null, fitNonce: v.fitNonce + 1 })
    }
  }, [film, builds, today, setK])
}

function useKeys(today: string) {
  useEffect(() => {
    let heldKey: string | null = null
    const down = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape') {
        if (s.film) s.setFilm(false)
        else if (s.hold) s.cancelHold()
        else if (s.viewDay) s.setViewDay(null)
        return
      }
      if (s.editing || s.film) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        s.undoLast()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= Math.min(s.goals.length, MAX_GOALS) && !e.repeat) {
        heldKey = e.key
        s.beginHold(s.goals[n - 1].id)
        return
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && s.since && !(e.target instanceof HTMLButtonElement && e.target.closest('.pads'))) {
        const cur = s.viewDay ?? today
        const next = addDays(cur, e.key === 'ArrowLeft' ? -1 : 1)
        if (daysBetween(s.since, next) >= 0 && daysBetween(next, today) >= 0) s.setViewDay(next)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (heldKey && e.key === heldKey) {
        heldKey = null
        useStore.getState().commitHold()
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [today])
}

export default function App() {
  const goals = useStore((s) => s.goals)
  const bricks = useStore((s) => s.bricks)
  const viewDay = useStore((s) => s.viewDay)
  const film = useStore((s) => s.film)
  const flying = useStore((s) => s.flying)
  const editing = useStore((s) => s.editing)
  const muted = useStore((s) => s.muted)
  const today = useToday()
  const mood = useMood()
  const { w, h } = useWindowSize()
  const [filmK, setFilmK] = useState(0)

  useEffect(() => setMuted(muted), [muted])
  useHoldGrowth()
  useKeys(today)

  const cols = w / h >= 1.05 ? MAX_GOALS : 2
  const layout = useMemo(() => setLayout(goals.length, cols), [goals.length, cols])
  const builds = useMemo(() => buildTowers(goals, bricks), [goals, bricks])
  useFilm(builds, today, setFilmK)

  const target = useMemo(() => {
    const c = film ? countsAfter(builds, bricks, filmK) : countsAt(builds, viewDay)
    if (flying)
      for (const [id, b] of builds)
        if (b.bricks.length && b.bricks[b.bricks.length - 1].id === flying) c[id] = Math.min(c[id], b.bricks.length - 1)
    return c
  }, [film, builds, bricks, filmK, viewDay, flying])
  const counts = useSteppedCounts(target, !film)

  // The shown day's bricks sit unpressed on top of their towers.
  const raised = useMemo(() => {
    const out: Record<string, [number, number]> = {}
    if (film) return out
    const day = viewDay ?? today
    const from = dayStart(day)
    const until = nextDayStart(day)
    for (const [id, b] of builds) {
      let lo = 0
      while (lo < b.bricks.length && b.bricks[lo].t < from) lo++
      let hi = lo
      while (hi < b.bricks.length && b.bricks[hi].t < until) hi++
      out[id] = [lo, hi]
    }
    return out
  }, [builds, viewDay, today, film])

  const hop = useHop(film ? 'film' : (viewDay ?? today))

  const tops = useMemo(() => new Map([...builds].map(([id, b]) => [id, towerTops(b)])), [builds])
  const height = useMemo(() => {
    let m = 0
    for (const [id, t] of tops) m = Math.max(m, t[Math.min(counts[id] ?? 0, t.length - 1)])
    return m * BRICK_H + UNPRESSED
  }, [tops, counts])

  const totals = useMemo(() => {
    const out: Record<string, number> = {}
    for (const [id, b] of builds) out[id] = b.bricks.length
    return out
  }, [builds])
  const labels = goals.map((g) => ({ id: g.id, name: g.name, count: counts[g.id] ?? 0 }))

  return (
    <main className="app" data-film={film || undefined}>
      <Stage mood={mood} builds={builds} layout={layout} counts={counts} raised={raised} lift={UNPRESSED + hop} height={height} labels={labels} />
      <div className="grain" aria-hidden />
      {!film && (
        <>
          <DayPanel today={today} />
          <TopBar />
          <footer className="bottom">
            {editing ? (
              <Picker />
            ) : (
              <>
                <DayStrip today={today} />
                <Dock counts={totals} />
              </>
            )}
          </footer>
          <Tooltip />
          <Inspector />
        </>
      )}
      <FilmFrame />
    </main>
  )
}
