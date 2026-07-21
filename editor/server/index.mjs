import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import {
  clearSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  requireSession,
  sessionCookie,
  verifyLogin,
} from './auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EDITOR_ROOT = path.resolve(__dirname, '..')
const DIST_DIR = path.join(EDITOR_ROOT, 'dist')
const PUBLIC_DIR = path.resolve(EDITOR_ROOT, '../bio/public')
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets')
const PORT = Number(process.env.PORT ?? 5180)

const app = express()
app.use(express.json({ limit: '25mb' }))

app.get('/api/auth/session', (req, res) => {
  const session = getSessionFromRequest(req)
  res.json({ authenticated: Boolean(session), user: session?.username ?? null })
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  const valid = await verifyLogin(username, password)
  if (!valid) {
    res.status(401).json({ error: 'Usuário ou senha inválidos' })
    return
  }
  const token = createSessionToken(username)
  res.setHeader('Set-Cookie', sessionCookie(token))
  res.json({ ok: true, user: username })
})

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.json({ ok: true })
})

app.post('/__upload', (req, res) => {
  if (!requireSession(req, res)) return

  const { name, data } = req.body ?? {}
  const base64 = String(data).includes(',') ? String(data).split(',')[1] : String(data)
  const buffer = Buffer.from(base64, 'base64')

  fs.mkdirSync(ASSETS_DIR, { recursive: true })
  const filename = uniqueFilename(sanitizeFilename(String(name)))
  fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer)
  res.json({ path: `/assets/${filename}` })
})

app.get('/api/bio/load', (req, res) => {
  if (!requireSession(req, res)) return

  try {
    const draftPath = path.join(PUBLIC_DIR, 'bio.draft.json')
    const publishedPath = path.join(PUBLIC_DIR, 'bio.json')
    if (fs.existsSync(draftPath)) {
      res.json({
        ok: true,
        config: JSON.parse(fs.readFileSync(draftPath, 'utf-8')),
        source: 'draft',
        hasDraft: true,
      })
      return
    }
    if (fs.existsSync(publishedPath)) {
      res.json({
        ok: true,
        config: JSON.parse(fs.readFileSync(publishedPath, 'utf-8')),
        source: 'published',
        hasDraft: false,
      })
      return
    }
    res.status(404).json({ error: 'Nenhuma configuração encontrada' })
  } catch {
    res.status(500).json({ error: 'Não foi possível carregar a configuração' })
  }
})

app.post('/api/bio/save', (req, res) => {
  if (!requireSession(req, res)) return

  try {
    const content = `${JSON.stringify(req.body, null, 2)}\n`
    fs.writeFileSync(path.join(PUBLIC_DIR, 'bio.draft.json'), content, 'utf-8')
    res.json({ ok: true, saved: 'draft' })
  } catch {
    res.status(500).json({ error: 'Não foi possível salvar o rascunho' })
  }
})

app.post('/api/bio/publish', (req, res) => {
  if (!requireSession(req, res)) return

  try {
    const content = `${JSON.stringify(req.body, null, 2)}\n`
    fs.writeFileSync(path.join(PUBLIC_DIR, 'bio.draft.json'), content, 'utf-8')
    fs.writeFileSync(path.join(PUBLIC_DIR, 'bio.json'), content, 'utf-8')
    res.json({ ok: true, saved: 'published' })
  } catch {
    res.status(500).json({ error: 'Não foi possível publicar a bio' })
  }
})

app.post('/api/bio/revert', (req, res) => {
  if (!requireSession(req, res)) return

  try {
    const publishedPath = path.join(PUBLIC_DIR, 'bio.json')
    if (!fs.existsSync(publishedPath)) {
      res.status(404).json({ error: 'Bio publicada não encontrada' })
      return
    }
    const config = JSON.parse(fs.readFileSync(publishedPath, 'utf-8'))
    fs.writeFileSync(
      path.join(PUBLIC_DIR, 'bio.draft.json'),
      `${JSON.stringify(config, null, 2)}\n`,
      'utf-8',
    )
    res.json({ ok: true, config })
  } catch {
    res.status(500).json({ error: 'Não foi possível reverter o rascunho' })
  }
})

app.use('/assets', express.static(ASSETS_DIR))
app.use(express.static(DIST_DIR))

app.get('/bio.json', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'bio.json'))
})

app.use((_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Admin online em http://localhost:${PORT}`)
})

function sanitizeFilename(name) {
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

function uniqueFilename(filename) {
  const parsed = path.parse(filename)
  let candidate = filename
  let counter = 1
  while (fs.existsSync(path.join(ASSETS_DIR, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`
    counter += 1
  }
  return candidate
}
