import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getSessionFromRequest, handleAuthRequest, requireSession } from './server/auth.mjs'

const ADMIN_ROOT = path.dirname(fileURLToPath(import.meta.url))

function normalizeBasePath(input?: string) {
  if (!input || input === '/') return '/'
  let value = input.trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
}

function editorBaseFrom(publicBase: string) {
  if (publicBase === '/') return '/editor/'
  return `${publicBase}editor/`
}

const ASSETS_DIR = path.resolve(ADMIN_ROOT, '../public/assets')

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

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
const BIO_JSON_PATH = path.resolve(ADMIN_ROOT, '../public/bio.json')

function isValidAssetName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
}

function bioUsesAsset(filename: string): boolean {
  if (!fs.existsSync(BIO_JSON_PATH)) return false
  const json = fs.readFileSync(BIO_JSON_PATH, 'utf-8')
  return [`assets/${filename}`, `/assets/${filename}`, filename].some((needle) =>
    json.includes(needle),
  )
}

function listAssetFiles() {
  if (!fs.existsSync(ASSETS_DIR)) return []
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((name) => {
      const full = path.join(ASSETS_DIR, name)
      if (!fs.statSync(full).isFile()) return false
      return IMAGE_EXT.has(path.extname(name).toLowerCase())
    })
    .map((name) => {
      const full = path.join(ASSETS_DIR, name)
      const stat = fs.statSync(full)
      return {
        name,
        path: `assets/${name}`,
        size: stat.size,
        modified: Math.floor(stat.mtimeMs / 1000),
      }
    })
    .sort((a, b) => b.modified - a.modified)
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
              path.resolve(ADMIN_ROOT, '../public/bio.json'),
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
            res.end(JSON.stringify({ path: `assets/${filename}` }))
          } catch (error) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: String(error) }))
          }
        })
      })

      server.middlewares.use('/api/assets/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        if (!requireSession(req, res)) return
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ files: listAssetFiles() }))
      })

      server.middlewares.use('/api/assets/delete', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        if (!requireSession(req, res)) return

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const { name } = JSON.parse(body) as { name?: string }
            const filename = path.basename(String(name ?? ''))
            if (!isValidAssetName(filename)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Nome de arquivo inválido' }))
              return
            }
            const full = path.join(ASSETS_DIR, filename)
            if (!fs.existsSync(full)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Arquivo não encontrado' }))
              return
            }
            if (bioUsesAsset(filename)) {
              res.statusCode = 409
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: 'Imagem em uso na bio. Remova das seções antes de excluir.',
                }),
              )
              return
            }
            fs.unlinkSync(full)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Não foi possível excluir' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ command }) => {
  const templateBuild = process.env.TEMPLATE_BUILD === '1'
  const publicBase = templateBuild ? 'auto' : normalizeBasePath(process.env.BASE_PATH)
  const editorBase = templateBuild
    ? './'
    : command === 'build'
      ? editorBaseFrom(publicBase === 'auto' ? '/' : publicBase)
      : '/'

  return {
    base: editorBase,
    define: {
      'import.meta.env.VITE_PUBLIC_BASE': JSON.stringify(publicBase),
    },
    plugins: [react(), tailwindcss(), uploadPlugin()],
    // Em dev servimos ../public para o editor ler o bio.json atual.
    // No build não copiamos o site inteiro para dentro do editor.
    publicDir:
      command === 'serve'
        ? path.resolve(ADMIN_ROOT, '../public')
        : path.resolve(ADMIN_ROOT, 'public'),
    resolve: {
      alias: {
        '@bio-types': path.resolve(ADMIN_ROOT, '../src/types/bio.ts'),
        '@site': path.resolve(ADMIN_ROOT, '../src'),
      },
    },
    server: {
      port: 5180,
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(ADMIN_ROOT, 'index.html'),
          preview: path.resolve(ADMIN_ROOT, 'preview.html'),
        },
      },
    },
  }
})
