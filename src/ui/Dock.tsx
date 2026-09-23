import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SIZE_WORD } from '../lib/layout'
import { MAX_GOALS } from '../lib/palette'
import { useStore, type Goal } from '../lib/store'
import { BrickGlyph, GLYPH_DIMS } from './BrickGlyph'

function Pad({ goal, index, count }: { goal: Goal; index: number; count: number }) {
  const hold = useStore((s) => s.hold)
  const holding = hold?.goal === goal.id
  const size = holding ? hold.size : 'm'
  const [w, d] = GLYPH_DIMS[size]
  const { beginHold, commitHold, cancelHold } = useStore.getState()

  return (
    <button
      type="button"
      className="pad"
      data-holding={holding || undefined}
      aria-label={`${goal.name}, ${count} bricks. Press to add a brick, hold for a bigger one.`}
      aria-keyshortcuts={String(index + 1)}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // no live pointer to capture (synthetic events); the release still lands on this pad
        }
        beginHold(goal.id)
      }}
      onPointerUp={() => {
        if (useStore.getState().hold?.goal === goal.id) commitHold()
      }}
      onPointerCancel={() => cancelHold()}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          beginHold(goal.id)
        }
      }}
      onKeyUp={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && useStore.getState().hold?.goal === goal.id) {
          e.preventDefault()
          commitHold()
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="pad-brick">
        <BrickGlyph w={w} d={d} color={goal.color} unit={13} />
      </span>
      <span className="pad-name">{goal.name}</span>
      <span className="pad-count">{count}</span>
    </button>
  )
}

export function Dock({ counts }: { counts: Record<string, number> }) {
  const goals = useStore((s) => s.goals)
  const setEditing = useStore((s) => s.setEditing)
  return (
    <div className="dock">
      <DropBar />
      <div className="pads" role="group" aria-label="Goals">
        {goals.map((g, i) => (
          <Pad key={g.id} goal={g} index={i} count={counts[g.id] ?? 0} />
        ))}
        {goals.length < MAX_GOALS && (
          <button type="button" className="pad pad-add" onClick={() => setEditing(true)} aria-label="Add a goal">
            <span className="pad-brick">
              <Plus size={20} strokeWidth={1.75} />
            </span>
            <span className="pad-name">Add</span>
          </button>
        )}
      </div>
    </div>
  )
}

const SHOW_MS = 8000

/** Right after a drop: name it, or take it back. Then it gets out of the way. */
function DropBar() {
  const lastDrop = useStore((s) => s.lastDrop)
  const brick = useStore((s) => (s.lastDrop ? s.bricks.find((b) => b.id === s.lastDrop!.id) : undefined))
  const goal = useStore((s) => (brick ? s.goals.find((g) => g.id === brick.goal) : undefined))
  const [writing, setWriting] = useState(false)
  const [shown, setShown] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!lastDrop) return
    setShown(lastDrop.id)
    setWriting(false)
    const t = window.setTimeout(() => setShown((s) => (s === lastDrop.id ? null : s)), SHOW_MS)
    return () => window.clearTimeout(t)
  }, [lastDrop])

  useEffect(() => {
    if (writing) input.current?.focus()
  }, [writing])

  if (!brick || !goal || (shown !== brick.id && !writing)) return <div className="dropbar" aria-live="polite" />
  const [w, d] = GLYPH_DIMS[brick.size]
  const save = () => {
    const v = input.current?.value ?? ''
    useStore.getState().setNote(brick.id, v)
    setWriting(false)
    setShown(null)
  }

  return (
    <div className="dropbar" aria-live="polite">
      <BrickGlyph w={w} d={d} color={goal.color} unit={6} />
      {writing ? (
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <input
            ref={input}
            className="note-input"
            defaultValue={brick.note ?? ''}
            placeholder="What was it?"
            maxLength={80}
            aria-label="Note for this brick"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setWriting(false)
                setShown(null)
              }
            }}
            onBlur={save}
          />
        </form>
      ) : (
        <>
          <span className="dropbar-text">
            {brick.note ? brick.note : `${goal.name}, ${SIZE_WORD[brick.size]} brick`}
          </span>
          <button type="button" className="textbtn" onClick={() => setWriting(true)}>
            {brick.note ? 'Edit note' : 'Add a note'}
          </button>
          <button type="button" className="textbtn" onClick={() => useStore.getState().undoLast()}>
            Undo
          </button>
        </>
      )}
    </div>
  )
}
