import { create } from 'zustand'

/** Screen-only state that changes often and is never saved. */
interface View {
  counts: Record<string, number> // bricks shown per goal right now
  filmFrame: number
  filmDay: string | null
  hover: { id: string; x: number; y: number } | null
  userMoved: boolean
  fitNonce: number
  bump: number // bumps when a brick lands hard; the camera jolts like a knocked table
  puff: { x: number; y: number; z: number; w: number; d: number; n: number } | null
  set: (p: Partial<Omit<View, 'set'>>) => void
}

export const useView = create<View>()((set) => ({
  counts: {},
  filmFrame: 0,
  filmDay: null,
  hover: null,
  userMoved: false,
  fitNonce: 0,
  bump: 0,
  puff: null,
  set: (p) => set(p),
}))

export const FPS = 12
export const FRAME_MS = 1000 / FPS
