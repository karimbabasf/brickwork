import { describe, expect, it } from 'vitest'
import { seatFor } from './derive'
import { emptyDoc, mergeDocs, sanitizeDoc, type LogDoc } from './merge'
import type { Brick, Goal } from './store'

const build: Goal = { id: 'g', preset: 'build', name: 'Build', color: '#c91a09' }

function add(doc: LogDoc, id: string, t: number, size: Brick['size'] = 's'): LogDoc {
  const at = seatFor(doc.goals, doc.bricks, 'g', size)
  return { ...doc, bricks: [...doc.bricks, { id, goal: 'g', size, t, at }] }
}

const base: LogDoc = { ...emptyDoc(), goals: [build], goalsAt: 1, since: '2026-09-20' }

describe('mergeDocs', () => {
  it('keeps bricks logged on either device', () => {
    const a = add(add(base, 'a1', 100), 'a2', 200)
    const b = add(base, 'b1', 150)
    const m = mergeDocs(a, b)
    expect(m.bricks.map((x) => x.id)).toEqual(['a1', 'b1', 'a2'])
  })

  it('a brick taken off on one device stays off after merging with the other', () => {
    const both = add(add(base, 'x', 100), 'y', 200)
    const phone = { ...both, bricks: both.bricks.filter((b) => b.id !== 'x'), removed: ['x'] }
    expect(mergeDocs(both, phone).bricks.map((b) => b.id)).toEqual(['y'])
    expect(mergeDocs(phone, both).bricks.map((b) => b.id)).toEqual(['y'])
  })

  it('two devices that picked the same seat: the older brick keeps it, the newer one moves', () => {
    const mac = add(base, 'mac', 100)
    const phone = add(base, 'phone', 200)
    expect(phone.bricks[0].at).toEqual(mac.bricks[0].at)
    const m = mergeDocs(mac, phone)
    const seat = (id: string) => m.bricks.find((b) => b.id === id)!.at!
    expect(seat('mac')).toEqual(mac.bricks[0].at)
    expect(seat('phone')).not.toEqual(seat('mac'))
  })

  it('takes the newer note and the newer goal list', () => {
    const a = add(base, 'n', 100)
    const b = { ...a, bricks: a.bricks.map((x) => ({ ...x, note: 'shipped', e: 500 })), goals: [{ ...build, name: 'Ship' }], goalsAt: 9 }
    const m = mergeDocs(a, b)
    expect(m.bricks[0].note).toBe('shipped')
    expect(m.goals[0].name).toBe('Ship')
  })

  it('never drops a goal that still has bricks', () => {
    const learn: Goal = { id: 'l', preset: 'learn', name: 'Learn', color: '#0055bf' }
    const a: LogDoc = { ...base, goals: [build, learn], goalsAt: 5, bricks: [{ id: 'k', goal: 'l', size: 's', t: 1 }] }
    const b: LogDoc = { ...base, goals: [build], goalsAt: 9 }
    expect(mergeDocs(a, b).goals.map((g) => g.id).sort()).toEqual(['g', 'l'])
  })
})

describe('sanitizeDoc', () => {
  it('rejects anything that is not a log', () => {
    expect(sanitizeDoc(null)).toBeNull()
    expect(sanitizeDoc({ v: 2 })).toBeNull()
    expect(sanitizeDoc({ v: 1, goals: 'x', bricks: [] })).toBeNull()
  })

  it('drops malformed entries and unknown fields, keeps the good ones', () => {
    const doc = sanitizeDoc({
      v: 1,
      goals: [build, { id: 'bad', name: 3 }],
      bricks: [
        { id: 'ok', goal: 'g', size: 'm', t: Date.parse('2026-09-21'), note: 'fine', evil: '<script>' },
        { id: 'nope', goal: 'g', size: 'xl', t: 5 },
      ],
      removed: ['r1', 42],
      since: '2026-09-20',
      goalsAt: 3,
      extra: true,
    })!
    expect(doc.goals.map((g) => g.id)).toEqual(['g'])
    expect(doc.bricks.map((b) => b.id)).toEqual(['ok'])
    expect(Object.keys(doc.bricks[0]).sort()).toEqual(['goal', 'id', 'note', 'size', 't'])
    expect(doc.removed).toEqual(['r1'])
    expect('extra' in doc).toBe(false)
  })
})
