import type { SizeKey } from './layout'

// Every sound is synthesised: a plastic snap for a landing brick, a tick for a
// size step, and a soft mallet note per brick in the film.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let noiseBuf: AudioBuffer | null = null

export function setMuted(m: boolean) {
  muted = m
  if (master) master.gain.value = m ? 0 : 0.8
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.8
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf
  noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.12), c.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noiseBuf
}

function burst(c: AudioContext, t: number, freq: number, q: number, peak: number, len: number) {
  const src = c.createBufferSource()
  src.buffer = noise(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  src.connect(bp).connect(g).connect(master!)
  src.start(t)
  src.stop(t + len + 0.02)
}

/** Two bricks pressing together. */
export function snap(weight = 1) {
  if (muted) return
  const c = ac()
  if (!c) return
  const t = c.currentTime
  burst(c, t, 3400, 1.4, 0.3 * weight, 0.04)
  burst(c, t + 0.012, 1900, 2, 0.16 * weight, 0.05)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(380, t)
  o.frequency.exponentialRampToValueAtTime(120, t + 0.06)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.16 * weight, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + 0.1)
  if (weight > 1) {
    // A big brick lands with a low thud under the click.
    const low = c.createOscillator()
    low.type = 'sine'
    low.frequency.setValueAtTime(110, t)
    low.frequency.exponentialRampToValueAtTime(60, t + 0.14)
    const lg = c.createGain()
    lg.gain.setValueAtTime(0.0001, t)
    lg.gain.exponentialRampToValueAtTime(0.14 * weight, t + 0.006)
    lg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    low.connect(lg).connect(master!)
    low.start(t)
    low.stop(t + 0.2)
  }
}

/** A brick prised off the studs: a bright pop that rises. */
export function pluck() {
  if (muted) return
  const c = ac()
  if (!c) return
  const t = c.currentTime
  burst(c, t, 2800, 1.6, 0.18, 0.035)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(320, t)
  o.frequency.exponentialRampToValueAtTime(760, t + 0.07)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + 0.12)
}

export function tick() {
  if (muted) return
  const c = ac()
  if (!c) return
  burst(c, c.currentTime, 5200, 3, 0.09, 0.025)
}

const SCALE = [0, 2, 4, 7, 9, 12] // major pentatonic: any mix of goals stays in tune

export function note(goalIndex: number, size: SizeKey, delay = 0) {
  if (muted) return
  const c = ac()
  if (!c) return
  const t = c.currentTime + delay
  const semis = SCALE[goalIndex % SCALE.length] + (size === 's' ? 12 : size === 'l' ? -12 : 0)
  const f = 261.63 * 2 ** (semis / 12)
  const voice = (freq: number, peak: number, len: number) => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    o.connect(g).connect(master!)
    o.start(t)
    o.stop(t + len + 0.02)
  }
  voice(f, 0.07, 0.55)
  voice(f * 3.99, 0.018, 0.12) // mallet overtone
}
