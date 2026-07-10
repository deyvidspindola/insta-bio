import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BIO_ROOT = path.dirname(fileURLToPath(import.meta.url))

function normalizeBasePath(input?: string) {
  if (!input || input === '/') return '/'
  let value = input.trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
}

/** Impede acesso HTTP público ao rascunho do editor. */
function blockDraftPlugin(): Plugin {
  return {
    name: 'block-bio-draft',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
        if (pathname === '/bio.draft.json' || pathname.endsWith('/bio.draft.json')) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Forbidden' }))
          return
        }
        next()
      })
    },
  }
}

const templateBuild = process.env.TEMPLATE_BUILD === '1'
const publicBase = templateBuild ? 'auto' : normalizeBasePath(process.env.BASE_PATH)

export default defineConfig({
  base: templateBuild ? './' : publicBase === '/' ? '/' : publicBase,
  build: {
    outDir: path.resolve(BIO_ROOT, '../dist'),
    emptyOutDir: true,
  },
  define: {
    'import.meta.env.VITE_PUBLIC_BASE': JSON.stringify(publicBase),
  },
  plugins: [react(), tailwindcss(), blockDraftPlugin()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
})
