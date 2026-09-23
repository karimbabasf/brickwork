import { addDays, dayKey, dayStart } from './days'
import type { SizeKey } from './layout'
import { PRESETS } from './palette'

// Synthetic history for ?demo, so the long view can be seen on day one. Never saved.

interface DemoGoal {
  id: string
  preset: string
  name: string
  color: string
}
interface DemoBrick {
  id: string
  goal: string
  size: SizeKey
  t: number
  note?: string
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOTES: Record<string, string[]> = {
  build: ['Shipped the settings page', 'Fixed the sync bug', 'First deploy', 'Wrote the parser', 'Cut a release', 'Closed six issues', 'Prototype works'],
  learn: ['Chapter 3 done', 'Two lectures', 'Solved five problems', 'Read a paper', 'Finished the module'],
  body: ['Gym, legs', '5k run', 'Swim', 'Gym, push', 'Long walk', 'Mobility'],
  money: ['Sent the invoice', 'Closed a deal', 'Pitch call', 'Budget review'],
  people: ['Called mom', 'Dinner with friends', 'Coffee intro', 'Wrote to a mentor'],
}

// Expected wins per day for each goal as a function of progress p (0..1) and weekday.
const RATE: Record<string, (p: number, wd: number) => number> = {
  build: (p, wd) => (wd === 0 ? 0.6 : 1.1 + 2.2 * p),
  learn: (p, wd) => (wd === 6 ? 0.3 : 0.6 + 1.1 * p),
  body: (_p, wd) => ([1, 3, 5].includes(wd) ? 1.3 : wd === 6 ? 0.9 : 0.25),
  money: (p) => 0.25 + 0.6 * p * p,
  people: (_p, wd) => (wd === 0 || wd === 6 ? 1.2 : 0.35),
}

export function demoData(days = 150) {
  const rand = mulberry32(20260923)
  const now = Date.now()
  const today = dayKey(now)
  const since = addDays(today, -(days - 1))
  const goals: DemoGoal[] = ['build', 'learn', 'body', 'money', 'people'].map((key) => {
    const p = PRESETS.find((x) => x.key === key)!
    return { id: `demo-${key}`, preset: key, name: p.name, color: p.color }
  })
  const bricks: DemoBrick[] = []
  let n = 0
  for (let d = 0; d < days; d++) {
    const key = addDays(since, d)
    const start = dayStart(key)
    const isToday = key === today
    const end = isToday ? now - 60_000 : start + 23.5 * 3_600_000
    const open = start + 8 * 3_600_000
    if (end <= open) continue
    const wd = new Date(start).getDay()
    const p = d / (days - 1)
    // A few quiet stretches, like real life.
    const slump = (d > 38 && d < 44) || (d > 96 && d < 99)
    for (const g of goals) {
      let rate = RATE[g.preset](p, wd) * (slump ? 0.15 : 1)
      if (isToday) rate *= (end - open) / (15.5 * 3_600_000)
      let count = 0
      while (rate > 0) {
        if (rand() < Math.min(rate, 1)) count++
        rate -= 1
      }
      for (let k = 0; k < count; k++) {
        const r = rand()
        const big = g.preset === 'build' ? 0.2 : 0.1
        const size: SizeKey = r < big ? 'l' : r < big + 0.3 ? 'm' : 's'
        const t = Math.floor(open + rand() * (end - open))
        const pool = NOTES[g.preset]
        const note = rand() < 0.3 ? pool[Math.floor(rand() * pool.length)] : undefined
        bricks.push({ id: `demo-${n++}`, goal: g.id, size, t, note })
      }
    }
  }
  bricks.sort((a, b) => a.t - b.t)
  return { v: 1 as const, goals, bricks, since, muted: false }
}
