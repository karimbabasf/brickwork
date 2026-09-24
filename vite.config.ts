import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed port: saved bricks live in this origin's localStorage. The Mac app loads the
// same dev server in development (Tauri's devUrl).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5188, strictPort: true },
  preview: { port: 5188, strictPort: true },
})
