import { describe, expect, it } from 'vitest'
import { FOOT, insetAt, SIZE_DIMS, Tower, type SizeKey } from './layout'

function sizes(n: number, seed: number): SizeKey[] {
  let s = seed
  return Array.from({ length: n }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const r = s % 10
    return r < 6 ? 's' : r < 9 ? 'm' : 'l'
  })
}

describe('Tower', () => {
  it('keeps every brick inside its layer setback, never overlapping, always resting on something', () => {
    const tower = new Tower('goal-a')
    const taken = new Set<string>()
    sizes(800, 3).forEach((size) => {
      const p = tower.push(size)
      const [a, b] = SIZE_DIMS[size]
      expect(p.w * p.d).toBe(a * b)
      const inset = insetAt(p.layer)
      expect(p.x).toBeGreaterThanOrEqual(inset)
      expect(p.z).toBeGreaterThanOrEqual(inset)
      expect(p.x + p.w).toBeLessThanOrEqual(FOOT - inset)
      expect(p.z + p.d).toBeLessThanOrEqual(FOOT - inset)
      let resting = p.layer === 0
      for (let x = p.x; x < p.x + p.w; x++)
        for (let z = p.z; z < p.z + p.d; z++) {
          const cell = `${x},${z},${p.layer}`
          expect(taken.has(cell)).toBe(false)
          taken.add(cell)
          if (taken.has(`${x},${z},${p.layer - 1}`)) resting = true
        }
      expect(resting).toBe(true)
    })
  })

  it('is deterministic, and a new brick never moves an older one', () => {
    const list = sizes(300, 7)
    const full = new Tower('g')
    list.forEach((s) => full.push(s))
    const part = new Tower('g')
    list.slice(0, 180).forEach((s) => part.push(s))
    expect(part.placements).toEqual(full.placements.slice(0, 180))
  })

  it('packs densely: 800 bricks stay within a few layers of a perfect stepped stack', () => {
    const tower = new Tower('dense')
    const list = sizes(800, 11)
    list.forEach((s) => tower.push(s))
    let cells = list.reduce((n, s) => n + SIZE_DIMS[s][0] * SIZE_DIMS[s][1], 0)
    let perfect = 0
    while (cells > 0) {
      const side = FOOT - 2 * insetAt(perfect)
      cells -= side * side
      perfect++
    }
    expect(tower.height).toBeLessThanOrEqual(Math.ceil(perfect * 1.08))
  })

  it('leaves no holes in the faces of a tower', () => {
    for (const seed of ['demo-build', 'a', 'goal-2', 'zz']) {
      const tower = new Tower(seed)
      sizes(600, 7).forEach((s) => tower.push(s))
      const taken = new Set<string>()
      for (const p of tower.placements)
        for (let x = p.x; x < p.x + p.w; x++) for (let z = p.z; z < p.z + p.d; z++) taken.add(`${x},${z},${p.layer}`)
      for (let L = 0; L < tower.height - 2; L++) {
        const i = insetAt(L)
        for (let x = i; x < FOOT - i; x++)
          for (let z = i; z < FOOT - i; z++) {
            const face = x === i || z === i || x === FOOT - 1 - i || z === FOOT - 1 - i
            if (face) expect(taken.has(`${x},${z},${L}`)).toBe(true)
          }
      }
    }
  })

  it('steps back: above the podium the tower is narrower than its base', () => {
    const tower = new Tower('tall')
    sizes(500, 5).forEach((s) => tower.push(s))
    const base = tower.placements.filter((p) => p.layer < 6)
    const top = tower.placements.filter((p) => p.layer >= 6)
    expect(top.length).toBeGreaterThan(0)
    expect(base.some((p) => p.x === 0 || p.x + p.w === FOOT)).toBe(true)
    for (const p of top) {
      expect(p.x).toBeGreaterThanOrEqual(1)
      expect(p.x + p.w).toBeLessThanOrEqual(FOOT - 1)
    }
  })
})
