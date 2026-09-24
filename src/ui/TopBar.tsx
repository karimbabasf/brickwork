import { CalendarDays, Play, Scan, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '../lib/store'
import { useView } from '../lib/view'

export function TopBar() {
  const muted = useStore((s) => s.muted)
  const setMuted = useStore((s) => s.setMuted)
  const viewDay = useStore((s) => s.viewDay)
  const setViewDay = useStore((s) => s.setViewDay)
  const hasBricks = useStore((s) => s.bricks.length > 0)
  const userMoved = useView((s) => s.userMoved)

  return (
    <nav className="topbar" aria-label="View">
      {viewDay && (
        <button type="button" className="tool" onClick={() => setViewDay(null)}>
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
          <span>Today</span>
        </button>
      )}
      {userMoved && (
        <button
          type="button"
          className="tool"
          onClick={() => useView.getState().set({ userMoved: false, fitNonce: useView.getState().fitNonce + 1 })}
        >
          <Scan size={18} strokeWidth={1.75} aria-hidden />
          <span>Fit</span>
        </button>
      )}
      <button
        type="button"
        className="tool"
        aria-pressed={!muted}
        aria-label={muted ? 'Sound off' : 'Sound on'}
        onClick={() => setMuted(!muted)}
      >
        {muted ? <VolumeX size={18} strokeWidth={1.75} aria-hidden /> : <Volume2 size={18} strokeWidth={1.75} aria-hidden />}
      </button>
      <button
        type="button"
        className="tool tool-film"
        disabled={!hasBricks}
        onClick={() => useStore.getState().setFilm(true)}
      >
        <Play size={16} strokeWidth={2} aria-hidden />
        <span>Play the film</span>
      </button>
    </nav>
  )
}
