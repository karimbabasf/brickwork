export interface Preset {
  key: string
  name: string
  color: string
}

// Toy-brick colours, one per goal. Colour only ever lives in the bricks.
export const PRESETS: Preset[] = [
  { key: 'build', name: 'Build', color: '#c91a09' },
  { key: 'money', name: 'Money', color: '#f2cd37' },
  { key: 'body', name: 'Body', color: '#ff698f' },
  { key: 'learn', name: 'Learn', color: '#0055bf' },
  { key: 'people', name: 'People', color: '#237841' },
  { key: 'create', name: 'Create', color: '#ac78ba' },
  { key: 'rest', name: 'Rest', color: '#36aebf' },
  { key: 'home', name: 'Home', color: '#aa7d55' },
]

export const GOLD = '#d9a23a'
export const MAX_GOALS = 6

/** Every hundredth brick of a goal comes out gold. */
export const isMilestone = (indexInGoal: number) => (indexInGoal + 1) % 100 === 0

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => {
    const v = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount
    return Math.max(0, Math.min(255, Math.round(v)))
  }
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
