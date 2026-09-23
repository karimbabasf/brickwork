export type SizeKey = 's' | 'm' | 'l'

export const FOOT = 8 // each goal builds on a FOOT x FOOT stud plot
export const BRICK_H = 1.2 // brick height in stud pitches (9.6 mm over 8 mm)
export const PLOT_GAP = 3
export const LABEL_DEPTH = 2
export const PLINTH_MARGIN = 2

// Setback: a goal first builds a wide podium, then a tower rises from it, so a big goal
// reads as a building instead of a bar. Keyed by layer, so old bricks never move.
// (A third 4x4 tier packed up to 30% looser, which shows as holes in the walls.)
export type Tiers = readonly { from: number; inset: number }[]

export const TIERS: Tiers = [
  { from: 0, inset: 0 }, // 8x8 podium
  { from: 6, inset: 1 }, // 6x6 tower
]

export function insetAt(layer: number, tiers: Tiers = TIERS): number {
  let inset = 0
  for (const t of tiers) if (layer >= t.from) inset = t.inset
  return inset
}

export const SIZE_DIMS: Record<SizeKey, readonly [number, number]> = {
  s: [1, 2],
  m: [2, 2],
  l: [2, 4],
}

export const SIZE_WORD: Record<SizeKey, string> = { s: 'small', m: 'solid', l: 'big' }

export interface Placement {
  x: number // min cell inside the plot
  z: number
  w: number // footprint after rotation
  d: number
  layer: number
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function hash01(a: number, b: number): number {
  let h = Math.imul(a ^ Math.imul(b, 0x9e3779b1), 0x85ebca77)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const onEdge = (x: number, z: number, inset: number) =>
  x === inset || z === inset || x === FOOT - 1 - inset || z === FOOT - 1 - inset

/**
 * Stacks one goal's bricks, oldest first. A brick always takes the lowest seat it
 * can inside that layer's setback, prefers to bridge two bricks below it (running
 * bond), and avoids leaving holes in the outer wall. Placement i depends only on
 * bricks 0..i-1, so adding a brick never moves an older one.
 */
export class Tower {
  private h = new Int16Array(FOOT * FOOT)
  private top = new Int32Array(FOOT * FOOT).fill(-1)
  private seed: number
  private tiers: Tiers
  readonly placements: Placement[] = []

  constructor(seed: string, tiers: Tiers = TIERS) {
    this.seed = fnv1a(seed)
    this.tiers = tiers
  }

  private blocked(x: number, z: number, level: number): number {
    const inset = insetAt(level, this.tiers)
    if (x < inset || z < inset || x >= FOOT - inset || z >= FOOT - inset) return 1
    return this.h[x * FOOT + z] > level ? 1 : 0
  }

  get height(): number {
    let m = 0
    for (const v of this.h) if (v > m) m = v
    return m
  }

  next(size: SizeKey): Placement {
    const [a, b] = SIZE_DIMS[size]
    const i = this.placements.length
    const orients: [number, number][] = a === b ? [[a, b]] : [[a, b], [b, a]]
    let best: Placement | null = null
    let bestScore = Infinity
    for (const [w, d] of orients) {
      for (let x = 0; x <= FOOT - w; x++) {
        for (let z = 0; z <= FOOT - d; z++) {
          let L = 0
          for (let dx = 0; dx < w; dx++)
            for (let dz = 0; dz < d; dz++) L = Math.max(L, this.h[(x + dx) * FOOT + z + dz])
          const inset = insetAt(L, this.tiers)
          if (x < inset || z < inset || x + w > FOOT - inset || z + d > FOOT - inset) continue
          let holes = 0
          let wallHoles = 0
          let firstBelow = -2
          let bridges = false
          for (let dx = 0; dx < w; dx++) {
            for (let dz = 0; dz < d; dz++) {
              const c = (x + dx) * FOOT + z + dz
              const gap = L - this.h[c]
              if (gap > 0) {
                holes += gap
                if (onEdge(x + dx, z + dz, inset)) wallHoles += gap
              } else if (L > 0) {
                const t = this.top[c]
                if (firstBelow === -2) firstBelow = t
                else if (t !== firstBelow) bridges = true
              }
            }
          }
          // Contact: edges touching the plot boundary or bricks already at this level. Packing
          // against something leaves no stranded single cells, so layers close up cleanly.
          let contact = 0
          for (let dx = 0; dx < w; dx++) {
            contact += this.blocked(x + dx, z - 1, L) + this.blocked(x + dx, z + d, L)
          }
          for (let dz = 0; dz < d; dz++) {
            contact += this.blocked(x - 1, z + dz, L) + this.blocked(x + w, z + dz, L)
          }
          // Look-ahead: a free cell beside this brick that ends up boxed in on all four sides
          // can only be roofed over later, which leaves a hole. On a face, that hole shows.
          let stranded = 0
          const inside = (cx: number, cz: number) => cx >= x && cx < x + w && cz >= z && cz < z + d
          const open = (cx: number, cz: number, level: number) =>
            cx >= inset && cz >= inset && cx < FOOT - inset && cz < FOOT - inset && !inside(cx, cz) && this.h[cx * FOOT + cz] <= level
          const probe = (cx: number, cz: number) => {
            if (!open(cx, cz, L)) return
            const lv = this.h[cx * FOOT + cz]
            if (open(cx + 1, cz, lv) || open(cx - 1, cz, lv) || open(cx, cz + 1, lv) || open(cx, cz - 1, lv)) return
            stranded += onEdge(cx, cz, inset) ? 6 : 1
          }
          for (let dx = 0; dx < w; dx++) {
            probe(x + dx, z - 1)
            probe(x + dx, z + d)
          }
          for (let dz = 0; dz < d; dz++) {
            probe(x - 1, z + dz)
            probe(x + w, z + dz)
          }
          const along = w === d ? -1 : w > d ? 0 : 1
          const weave = along === -1 || along === (L & 1) ? 0 : 1
          const jitter = hash01(this.seed + i * 7919, (x * 31 + z) * 4 + (w > d ? 1 : 0))
          // Walls first: an outer cell left empty shows as a chip in the tower's face.
          let wallCover = 0
          for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) if (onEdge(x + dx, z + dz, inset)) wallCover++
          const score =
            L * 1000 + holes * 30 + wallHoles * 350 + stranded * 150 - wallCover * 20 - contact * 12 - (bridges ? 10 : 0) + weave * 4 + jitter * 2
          if (score < bestScore) {
            bestScore = score
            best = { x, z, w, d, layer: L }
          }
        }
      }
    }
    // The top tier always has a free 6x6 above its highest brick, so a seat always exists.
    return best!
  }

  push(size: SizeKey): Placement {
    const p = this.next(size)
    const i = this.placements.length
    for (let dx = 0; dx < p.w; dx++)
      for (let dz = 0; dz < p.d; dz++) {
        const c = (p.x + dx) * FOOT + p.z + dz
        this.h[c] = p.layer + 1
        this.top[c] = i
      }
    this.placements.push(p)
    return p
  }
}

export interface SetLayout {
  plots: { x: number; z: number }[] // min corner of each plot, world units
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Plots in rows of `cols`, centred on the origin, on whole-stud offsets. */
export function setLayout(n: number, cols: number): SetLayout {
  const count = Math.max(n, 1)
  const c = Math.max(1, Math.min(cols, count))
  const rows = Math.ceil(count / c)
  const cellW = FOOT
  const cellD = FOOT + LABEL_DEPTH
  const width = c * cellW + (c - 1) * PLOT_GAP
  const depth = rows * cellD + (rows - 1) * PLOT_GAP
  const x0 = Math.round(-width / 2)
  const z0 = Math.round(-depth / 2)
  const plots: { x: number; z: number }[] = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / c)
    const inRow = Math.min(c, n - row * c)
    const shift = Math.floor(((c - inRow) * (cellW + PLOT_GAP)) / 2)
    plots.push({ x: x0 + shift + (i % c) * (cellW + PLOT_GAP), z: z0 + row * (cellD + PLOT_GAP) })
  }
  return {
    plots,
    minX: x0 - PLINTH_MARGIN,
    maxX: x0 + width + PLINTH_MARGIN,
    minZ: z0 - PLINTH_MARGIN,
    maxZ: z0 + depth + PLINTH_MARGIN,
  }
}

/** World-space centre (x, z) of a placement, bottom y at layer. */
export function placementCenter(p: Placement, plot: { x: number; z: number }) {
  return {
    x: plot.x + p.x + p.w / 2,
    z: plot.z + p.z + p.d / 2,
    y: p.layer * BRICK_H,
    rotated: p.w !== p.d && p.w > p.d, // base geometry runs its long side along z
  }
}
