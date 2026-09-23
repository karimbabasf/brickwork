import { useEffect, useMemo, useRef } from 'react'
import { addDays, dayOfMonth, daysBetween, formatDayShort, formatMonth } from '../lib/days'
import { bricksByDay } from '../lib/derive'
import { useStore } from '../lib/store'

const SEG_W = { s: 8, m: 12, l: 16 } as const
const MAX_SEGS = 9

/** One step per day, like a sequencer row. Each step holds that day's bricks as a tiny stack. */
export function DayStrip({ today }: { today: string }) {
  const goals = useStore((s) => s.goals)
  const bricks = useStore((s) => s.bricks)
  const since = useStore((s) => s.since)
  const viewDay = useStore((s) => s.viewDay)
  const setViewDay = useStore((s) => s.setViewDay)
  const scroller = useRef<HTMLDivElement>(null)

  const days = useMemo(() => {
    const first = since ?? today
    const n = Math.max(1, daysBetween(first, today) + 1)
    const byDay = bricksByDay(bricks)
    return Array.from({ length: n }, (_, i) => {
      const key = addDays(first, i)
      return { key, bricks: byDay.get(key) ?? [] }
    })
  }, [bricks, since, today])

  const color = useMemo(() => new Map(goals.map((g) => [g.id, g.color])), [goals])
  const selected = viewDay ?? today

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length])

  useEffect(() => {
    scroller.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selected])

  if (days.length < 2) return null // one step is not a timeline yet

  return (
    <div className="strip" ref={scroller} role="listbox" aria-label="Days" aria-orientation="horizontal">
      {days.map(({ key, bricks: list }) => {
        const d = dayOfMonth(key)
        const isSel = key === selected
        const segs = list.slice(-MAX_SEGS)
        return (
          <button
            key={key}
            type="button"
            role="option"
            aria-selected={isSel}
            aria-label={`${formatDayShort(key)}, ${list.length} ${list.length === 1 ? 'brick' : 'bricks'}`}
            className="day"
            data-today={key === today || undefined}
            onClick={() => setViewDay(key)}
          >
            <span className="day-stack">
              {segs.map((b) => (
                <span key={b.id} className="seg" style={{ width: SEG_W[b.size], background: color.get(b.goal) }} />
              ))}
              {list.length > MAX_SEGS && <span className="seg-more">+{list.length - MAX_SEGS}</span>}
            </span>
            <span className="day-num">{d}</span>
            {(d === 1 || key === days[0].key) && <span className="day-month">{formatMonth(key)}</span>}
          </button>
        )
      })}
    </div>
  )
}
