import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed port: saved bricks live in this origin's localStorage.
export default defineConfig({
  plugins: [react()],
  server: { port: 5188, strictPort: true },
  preview: { port: 5188, strictPort: true },
})
