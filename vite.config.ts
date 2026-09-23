import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed port: saved bricks live in this origin's localStorage.
// /api goes to the deployed app, so a local copy opened with its sync link syncs too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5188,
    strictPort: true,
    proxy: { '/api': { target: process.env.BRICKWORK_API ?? 'https://brickwork-iota.vercel.app', changeOrigin: true } },
  },
  preview: { port: 5188, strictPort: true },
})
