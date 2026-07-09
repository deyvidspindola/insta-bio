import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function normalizeBasePath(input?: string) {
  if (!input || input === '/') return '/'
  let value = input.trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
}

const templateBuild = process.env.TEMPLATE_BUILD === '1'
const publicBase = templateBuild ? 'auto' : normalizeBasePath(process.env.BASE_PATH)

export default defineConfig({
  base: templateBuild ? './' : publicBase === '/' ? '/' : publicBase,
  define: {
    'import.meta.env.VITE_PUBLIC_BASE': JSON.stringify(publicBase),
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
})
