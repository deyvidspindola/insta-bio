import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getSessionFromRequest, handleAuthRequest, requireSession } from './server/auth.mjs'

const ASSETS_DIR = path.resolve(__dirname, '../public/assets')

function sanitizeFilename(name: string): string {
  const parsed = path.parse(name)
  const base = parsed.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'imagem'
  const ext = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, '') || '.png'
  return `${base}${ext}`
}

function uniqueFilename(filename: string): string {
  const parsed = path.parse(filename)
  let candidate = filename
  let counter = 1
  while (fs.existsSync(path.join(ASSETS_DIR, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`
    counter += 1
  }
  return candidate
}

// Recebe uma imagem em base64 e grava em public/assets, devolvendo o caminho.
function uploadPlugin(): Plugin {
  return {
    name: 'bio-image-upload',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleAuthRequest(req, res)
        if (handled) return
        next()
      })

      server.middlewares.use('/api/bio/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!getSessionFromRequest(req)) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Não autenticado' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            fs.writeFileSync(
              path.resolve(__dirname, '../public/bio.json'),
              `${JSON.stringify(parsed, null, 2)}\n`,
              'utf-8',
            )
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Não foi possível salvar o bio.json' }))
          }
        })
      })

      server.middlewares.use('/__upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!requireSession(req, res)) return

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > 25_000_000) req.destroy()
        })

        req.on('end', () => {
          try {
            const { name, data } = JSON.parse(body) as { name: string; data: string }
            const base64 = data.includes(',') ? data.split(',')[1] : data
            const buffer = Buffer.from(base64, 'base64')

            fs.mkdirSync(ASSETS_DIR, { recursive: true })
            const filename = uniqueFilename(sanitizeFilename(name))
            fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: `/assets/${filename}` }))
          } catch (error) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: String(error) }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  // Caminhos relativos no build para o editor rodar em qualquer subpasta
  // (ex.: seusite.com/editor/). Em dev mantém raiz.
  base: command === 'build' ? './' : '/',
  plugins: [react(), tailwindcss(), uploadPlugin()],
  // Em dev servimos ../public para o editor ler o bio.json atual.
  // No build não copiamos o site inteiro para dentro do editor.
  publicDir: command === 'serve' ? path.resolve(__dirname, '../public') : false,
  resolve: {
    alias: {
      '@bio-types': path.resolve(__dirname, '../src/types/bio.ts'),
      '@site': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 5180,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        preview: path.resolve(__dirname, 'preview.html'),
      },
    },
  },
}))
