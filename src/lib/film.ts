import { dayKey } from './days'
import type { Brick } from './store'

export interface FilmFrame {
  k: number // bricks revealed so far, oldest first
  day: string
}

const INTRO = 10
const OUTRO = 30
const MAX_REVEAL_FRAMES = 168 // 14 s at 12 fps, whatever the history length

export function filmFrames(bricks: Brick[], since: string, today: string): FilmFrame[] {
  const n = bricks.length
  const frames: FilmFrame[] = []
  for (let i = 0; i < INTRO; i++) frames.push({ k: 0, day: since })
  const per = Math.max(1, Math.ceil(n / MAX_REVEAL_FRAMES))
  for (let k = per; k < n + per; k += per) {
    const kk = Math.min(k, n)
    frames.push({ k: kk, day: dayKey(bricks[kk - 1].t) })
  }
  for (let i = 0; i < OUTRO; i++) frames.push({ k: n, day: today })
  return frames
}
