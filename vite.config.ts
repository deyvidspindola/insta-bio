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

const publicBase = normalizeBasePath(process.env.BASE_PATH)

export default defineConfig({
  base: publicBase,
  define: {
    'import.meta.env.VITE_PUBLIC_BASE': JSON.stringify(publicBase),
  },
  plugins: [react(), tailwindcss()],
})
