import { useMemo } from 'react'
import { daysBetween, dayKey, formatDayLong } from '../lib/days'
import { bricksOnDay } from '../lib/derive'
import type { SizeKey } from '../lib/layout'
import { useStore } from '../lib/store'
import { BrickGlyph, GLYPH_DIMS } from './BrickGlyph'

const ORDER: SizeKey[] = ['l', 'm', 's']

/** The step number, the day, and the day's new parts, the way a build booklet calls them out. */
export function DayPanel({ today }: { today: string }) {
  const goals = useStore((s) => s.goals)
  const bricks = useStore((s) => s.bricks)
  const since = useStore((s) => s.since)
  const viewDay = useStore((s) => s.viewDay)
  const day = viewDay ?? today
  const step = since ? Math.max(1, daysBetween(since, day) + 1) : 1

  const { rows, notes, total } = useMemo(() => {
    const list = bricksOnDay(bricks, day)
    const rows = goals
      .map((g) => {
        const mine = list.filter((b) => b.goal === g.id)
        const parts = ORDER.map((size) => ({ size, n: mine.filter((b) => b.size === size).length })).filter((p) => p.n > 0)
        return { goal: g, parts }
      })
      .filter((r) => r.parts.length > 0)
    const notes = list.filter((b) => b.note).slice(-5)
    return { rows, notes, total: list.length }
  }, [goals, bricks, day])

  const isToday = day === today
  const empty = bricks.length === 0
  const picking = useStore((s) => s.editing && s.since === null)

  return (
    <section className="daypanel" aria-label="The day">
      <div className="step" aria-label={`Day ${step}`}>
        <span className="step-unit" aria-hidden>
          Day
        </span>
        {step}
      </div>
      <p className="date">
        {isToday ? 'Today' : formatDayLong(day)}
        {isToday && <span className="date-soft">, {formatDayLong(day).split(', ')[1]}</span>}
      </p>
      {picking ? null : empty ? (
        <p className="hint">Press a brick below to log a win. Hold it for a bigger one.</p>
      ) : total === 0 ? (
        <p className="hint">{isToday ? 'No bricks yet today.' : 'No bricks this day.'}</p>
      ) : (
        <ul className="parts">
          {rows.map(({ goal, parts }) => (
            <li key={goal.id} className="parts-row">
              <span className="parts-name">{goal.name}</span>
              {parts.map((p) => {
                const [w, d] = GLYPH_DIMS[p.size]
                return (
                  <span key={p.size} className="part">
                    <BrickGlyph w={w} d={d} color={goal.color} unit={7} />
                    <span className="part-n">{p.n}x</span>
                  </span>
                )
              })}
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <ul className="notes">
          {notes.map((b) => {
            const g = goals.find((x) => x.id === b.goal)
            return (
              <li key={b.id}>
                {g && <BrickGlyph w={1} d={1} color={g.color} unit={6} />}
                <span>{b.note}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export const todayKey = () => dayKey(Date.now())
