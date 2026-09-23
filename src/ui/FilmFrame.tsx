import { Square } from 'lucide-react'
import { daysBetween, formatDayLong } from '../lib/days'
import { useStore } from '../lib/store'
import { useView } from '../lib/view'

/** Letterbox bars and the slate line. They cut in and out on a single frame. */
export function FilmFrame() {
  const film = useStore((s) => s.film)
  const since = useStore((s) => s.since)
  const day = useView((s) => s.filmDay)
  if (!film) return null
  const step = since && day ? daysBetween(since, day) + 1 : 1
  return (
    <div className="film" role="dialog" aria-label="Film of the whole build">
      <div className="film-bar film-top" />
      <div className="film-bar film-bottom">
        <span className="film-step">{step}</span>
        <span className="film-date">{day ? formatDayLong(day) : ''}</span>
        <button type="button" className="film-stop" onClick={() => useStore.getState().setFilm(false)}>
          <Square size={12} strokeWidth={2.5} aria-hidden />
          <span>Stop</span>
        </button>
      </div>
    </div>
  )
}
