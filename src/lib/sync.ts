import { create } from 'zustand'
import { mergeDocs, sanitizeDoc, type LogDoc } from './merge'
import { toDoc, useStore } from './store'

// Sync is one round trip: send the whole log, the server merges it with what it has
// and returns the result, which merges back here. No accounts: a private token,
// opened once per device from a link (#sync=...), unlocks the one shared log.

const TOKEN_KEY = 'brickwork.sync'
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/

export type SyncStatus = 'off' | 'syncing' | 'ok' | 'offline' | 'denied'
export const useSync = create<{ status: SyncStatus; token: string | null }>(() => ({ status: 'off', token: null }))

function readToken(): string | null {
  let token: string | null = null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    // storage blocked: sync stays off
  }
  const m = location.hash.match(/sync=([A-Za-z0-9_-]{32,128})/)
  if (m) {
    token = m[1]
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // keep it for this session only
    }
    history.replaceState(null, '', location.pathname + location.search) // the token leaves the address bar
  }
  return token && TOKEN_RE.test(token) ? token : null
}

export function syncLink(): string | null {
  const { token } = useSync.getState()
  return token ? `${location.origin}/#sync=${token}` : null
}

const same = (a: LogDoc, b: LogDoc) => JSON.stringify(a) === JSON.stringify(b)

export function startSync(): () => void {
  const token = readToken()
  useSync.setState({ token, status: token ? 'syncing' : 'off' })
  if (!token) return () => {}

  let inFlight = false
  let queued = false
  let lastSynced: LogDoc | null = null
  let timer = 0

  const run = async () => {
    if (inFlight) {
      queued = true
      return
    }
    inFlight = true
    useSync.setState({ status: 'syncing' })
    try {
      const sent = toDoc(useStore.getState())
      const res = await fetch('/api/log', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(sent),
        cache: 'no-store',
      })
      if (res.status === 401) {
        useSync.setState({ status: 'denied' })
        return
      }
      if (!res.ok) throw new Error(`sync ${res.status}`)
      const remote = sanitizeDoc(await res.json())
      if (remote) {
        // Anything changed here while the request was out is kept by merging again.
        const merged = mergeDocs(toDoc(useStore.getState()), remote)
        lastSynced = merged
        if (!same(merged, toDoc(useStore.getState()))) useStore.getState().applyDoc(merged)
      }
      useSync.setState({ status: 'ok' })
    } catch {
      useSync.setState({ status: 'offline' })
    } finally {
      inFlight = false
      if (queued) {
        queued = false
        void run()
      }
    }
  }

  const soon = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(run, 1200)
  }

  const unsubscribe = useStore.subscribe((s, prev) => {
    if (s.goals === prev.goals && s.bricks === prev.bricks && s.removed === prev.removed && s.since === prev.since) return
    if (lastSynced && same(lastSynced, toDoc(s))) return // the change was the sync itself
    soon()
  })
  const onWake = () => {
    if (document.visibilityState === 'visible') void run()
  }
  document.addEventListener('visibilitychange', onWake)
  window.addEventListener('online', onWake)
  const beat = window.setInterval(onWake, 60_000)
  void run()

  return () => {
    unsubscribe()
    document.removeEventListener('visibilitychange', onWake)
    window.removeEventListener('online', onWake)
    window.clearInterval(beat)
    window.clearTimeout(timer)
  }
}
