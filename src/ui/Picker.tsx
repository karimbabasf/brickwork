import { Check } from 'lucide-react'
import { MAX_GOALS, PRESETS } from '../lib/palette'
import { useStore } from '../lib/store'
import { BrickGlyph } from './BrickGlyph'

/** First run and the add button: pick goals by tapping bricks. Names are editable, never required. */
export function Picker() {
  const goals = useStore((s) => s.goals)
  const bricks = useStore((s) => s.bricks)
  const { toggleGoal, renameGoal, setEditing } = useStore.getState()
  const first = bricks.length === 0 && useStore.getState().since === null
  const full = goals.length >= MAX_GOALS

  return (
    <section className="picker" aria-labelledby="picker-title">
      <header className="picker-head">
        <h1 id="picker-title">{first ? 'What are you building?' : 'Goals'}</h1>
        <p>Pick up to six. Each one gets its own tower. Tap a name to change it.</p>
      </header>
      <div className="choices">
        {PRESETS.map((p) => {
          const goal = goals.find((g) => g.preset === p.key)
          const n = goal ? bricks.filter((b) => b.goal === goal.id).length : 0
          const locked = n > 0
          return (
            <div key={p.key} className="choice" data-on={goal ? true : undefined}>
              <button
                type="button"
                className="choice-brick"
                aria-pressed={!!goal}
                aria-label={goal ? `Remove ${goal.name}` : `Add ${p.name}`}
                disabled={locked || (!goal && full)}
                onClick={() => toggleGoal(p.key)}
              >
                <BrickGlyph w={4} d={2} color={p.color} unit={11} />
                {goal && (
                  <span className="choice-mark" aria-hidden>
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                )}
              </button>
              {goal ? (
                <input
                  className="choice-name"
                  size={Math.max(4, goal.name.length)}
                  defaultValue={goal.name}
                  maxLength={18}
                  aria-label={`Name for the ${p.name} goal`}
                  onBlur={(e) => renameGoal(goal.id, e.currentTarget.value || p.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                  }}
                />
              ) : (
                <span className="choice-name choice-name-off">{p.name}</span>
              )}
              {locked && <span className="choice-count">{n} bricks</span>}
            </div>
          )
        })}
      </div>
      <button type="button" className="primary" disabled={goals.length === 0} onClick={() => setEditing(false)}>
        {first ? 'Start building' : 'Done'}
      </button>
    </section>
  )
}
