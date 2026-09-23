import { useEffect, useState } from 'react'

/** The set is lit for the room it is used in: daylight, or one warm lamp at night. */
export type Mood = 'day' | 'night'

export interface SetLook {
  sweep: string
  fog: string
  fogNear: number
  fogFar: number
  hemiSky: string
  hemiGround: string
  hemi: number
  key: string
  keyIntensity: number
  fill: string
  fillIntensity: number
  env: number
  envBg: string
  plinth: string
  tile: string
  print: string
  vignette: number
}

export const LOOKS: Record<Mood, SetLook> = {
  day: {
    sweep: '#c1c3c2',
    fog: '#c9cac6',
    fogNear: 220,
    fogFar: 900,
    hemiSky: '#eef1f4',
    hemiGround: '#85847e',
    hemi: 0.5,
    key: '#fffaf3',
    keyIntensity: 3.2,
    fill: '#dde6f5',
    fillIntensity: 0.5,
    env: 0.6,
    envBg: '#cfd0cd',
    plinth: '#575d66',
    tile: '#f1efe9',
    print: '#232420',
    vignette: 0.3,
  },
  night: {
    sweep: '#3a3a3e',
    fog: '#141413',
    fogNear: 90,
    fogFar: 520,
    hemiSky: '#8a857c',
    hemiGround: '#1d1c1b',
    hemi: 0.46,
    key: '#ffe2c4',
    keyIntensity: 4.2,
    fill: '#8fa6d6',
    fillIntensity: 0.16,
    env: 0.42,
    envBg: '#2a292c',
    plinth: '#575d66',
    tile: '#efebe3',
    print: '#232420',
    vignette: 0.4,
  },
}

function forced(): Mood | null {
  if (typeof location === 'undefined') return null
  const q = new URLSearchParams(location.search)
  return q.has('night') ? 'night' : q.has('day') ? 'day' : null
}

export function useMood(): Mood {
  const [mood, setMood] = useState<Mood>(() => forced() ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'))
  useEffect(() => {
    if (forced()) return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setMood(mq.matches ? 'night' : 'day')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.mood = mood
  }, [mood])
  return mood
}
