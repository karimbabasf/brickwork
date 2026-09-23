import { shade } from '../lib/palette'

const H = 1.2 // brick height, stud pitches
const SH = 0.2 // stud height
const R = 0.3 // stud radius
const C = Math.cos(Math.PI / 6)
const S = 0.5

interface Props {
  w: number // studs along the right-running edge
  d: number // studs along the left-running edge
  color: string
  unit?: number // px per stud pitch
  className?: string
  title?: string
}

/** A brick drawn in the same isometric view everywhere in the UI. */
export function BrickGlyph({ w, d, color, unit = 12, className, title }: Props) {
  const P = (x: number, y: number, z: number) => [(x - z) * C * unit, (x + z) * S * unit - y * unit] as const
  const pts = (...ps: (readonly [number, number])[]) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  const pad = 1
  const minX = -d * C * unit - pad
  const maxX = w * C * unit + pad
  const minY = -(H + SH) * unit - pad
  const maxY = (w + d) * S * unit + pad
  const rx = R * Math.SQRT2 * C * unit
  const ry = R * Math.SQRT2 * S * unit
  const studs: [number, number][] = []
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) studs.push([i, j])
  studs.sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
  return (
    <svg
      className={className}
      viewBox={`${minX.toFixed(2)} ${minY.toFixed(2)} ${(maxX - minX).toFixed(2)} ${(maxY - minY).toFixed(2)}`}
      width={maxX - minX}
      height={maxY - minY}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <polygon points={pts(P(w, 0, 0), P(w, H, 0), P(w, H, d), P(w, 0, d))} fill={shade(color, -0.3)} />
      <polygon points={pts(P(0, 0, d), P(w, 0, d), P(w, H, d), P(0, H, d))} fill={shade(color, -0.14)} />
      <polygon points={pts(P(0, H, 0), P(w, H, 0), P(w, H, d), P(0, H, d))} fill={color} />
      <polyline points={pts(P(0, H, d), P(w, H, d), P(w, H, 0))} fill="none" stroke={shade(color, 0.28)} strokeWidth={Math.max(0.6, unit * 0.06)} strokeLinejoin="round" />
      {studs.map(([i, j]) => {
        const [cx, cy] = P(i + 0.5, H, j + 0.5)
        const ty = cy - SH * unit
        return (
          <g key={`${i}-${j}`}>
            <path
              d={`M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${ty} A${rx},${ry} 0 0 1 ${cx - rx},${ty} Z`}
              fill={shade(color, -0.22)}
            />
            <ellipse cx={cx} cy={ty} rx={rx} ry={ry} fill={shade(color, 0.1)} />
          </g>
        )
      })}
    </svg>
  )
}

/** Glyph dimensions for a size, long side running to the right. */
export const GLYPH_DIMS = { s: [2, 1], m: [2, 2], l: [4, 2] } as const
