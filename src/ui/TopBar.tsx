import { CalendarDays, Cloud, CloudOff, Play, Scan, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { syncLink, useSync } from '../lib/sync'
import { useView } from '../lib/view'

/** Shown only on a synced device: the state of the sync, and the link for another device. */
function SyncButton() {
  const status = useSync((s) => s.status)
  const [copied, setCopied] = useState(false)
  if (status === 'off') return null
  const down = status === 'offline' || status === 'denied'
  const label =
    status === 'denied'
      ? 'This sync link is no longer valid'
      : down
        ? 'Offline. Your bricks sync when you are back'
        : 'Synced. Copy the link to open your log on another device'
  const share = async () => {
    const url = syncLink()
    if (!url || status === 'denied') return
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ url, title: 'Brickwork' })
      else await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      // share sheet dismissed
    }
  }
  return (
    <button type="button" className="tool" aria-label={label} title={label} onClick={share} data-down={down || undefined}>
      {down ? <CloudOff size={18} strokeWidth={1.75} aria-hidden /> : <Cloud size={18} strokeWidth={1.75} aria-hidden />}
      {copied && <span>Link copied</span>}
    </button>
  )
}

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
      <SyncButton />
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
