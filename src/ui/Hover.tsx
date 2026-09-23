import { Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { dayKey, formatDayLong, formatTime } from '../lib/days'
import { SIZE_WORD } from '../lib/layout'
import { useStore } from '../lib/store'
import { useView } from '../lib/view'

function place(x: number, y: number, w: number, h: number) {
  const left = Math.min(Math.max(12, x + 14), window.innerWidth - w - 12)
  const top = y + 16 + h > window.innerHeight - 12 ? y - h - 12 : y + 16
  return { left, top }
}

/** Centred just above the pointer, so the label sits on the brick it names. */
function above(x: number, y: number, w: number, h: number) {
  const left = Math.min(Math.max(12, x - w / 2), window.innerWidth - w - 12)
  const top = y - h - 18 < 12 ? y + 22 : y - h - 18
  return { left, top }
}

/** Hovering a brick says what it was. */
export function Tooltip() {
  const hover = useView((s) => s.hover)
  const inspect = useStore((s) => s.inspect)
  const film = useStore((s) => s.film)
  const brick = useStore((s) => (hover ? s.bricks.find((b) => b.id === hover.id) : undefined))
  const goal = useStore((s) => (brick ? s.goals.find((g) => g.id === brick.goal) : undefined))
  if (!hover || !brick || !goal || inspect || film) return null
  return (
    <div className="tip" style={{ ...above(hover.x, hover.y, 240, brick.note ? 58 : 38), width: 240 }} role="tooltip">
      <p className="tip-line">
        {goal.name}, {SIZE_WORD[brick.size]} brick. {formatDayLong(dayKey(brick.t))}
      </p>
      {brick.note && <p className="tip-note">{brick.note}</p>}
    </div>
  )
}

/** Clicking a brick opens it: add or change the note, or take it off the tower. */
export function Inspector() {
  const inspect = useStore((s) => s.inspect)
  const brick = useStore((s) => (s.inspect ? s.bricks.find((b) => b.id === s.inspect!.id) : undefined))
  const goal = useStore((s) => (brick ? s.goals.find((g) => g.id === brick.goal) : undefined))
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inspect) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useStore.getState().setInspect(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inspect])

  if (!inspect || !brick || !goal) return null
  const save = () => useStore.getState().setNote(brick.id, input.current?.value ?? '')
  return (
    <div className="inspector" style={place(inspect.x, inspect.y, 280, 150)} role="dialog" aria-label="Brick">
      <p className="tip-line">
        {goal.name}, {SIZE_WORD[brick.size]} brick
      </p>
      <p className="tip-soft">
        {formatDayLong(dayKey(brick.t))}, {formatTime(brick.t)}
      </p>
      <input
        key={brick.id}
        ref={input}
        className="note-input"
        defaultValue={brick.note ?? ''}
        placeholder="What was it?"
        maxLength={80}
        aria-label="Note"
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            save()
            useStore.getState().setInspect(null)
          }
        }}
      />
      <button type="button" className="textbtn textbtn-danger" onClick={() => useStore.getState().removeBrick(brick.id)}>
        <Trash2 size={14} strokeWidth={1.75} aria-hidden />
        Take this brick off
      </button>
    </div>
  )
}
