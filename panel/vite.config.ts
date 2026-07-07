import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { platformDevPlugin } from './server/dev-platform.mjs'

const PANEL_ROOT = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/panel/',
  plugins: [react(), tailwindcss(), platformDevPlugin()],
  resolve: {
    alias: {
      '@shared': path.resolve(PANEL_ROOT, '../src'),
    },
  },
  server: {
    port: 5175,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
