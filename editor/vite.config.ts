import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getSessionFromRequest, handleAuthRequest, requireSession } from './server/auth.mjs'

const EDITOR_ROOT = path.dirname(fileURLToPath(import.meta.url))

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

const BIO_ROOT = path.resolve(EDITOR_ROOT, '../bio')
const ASSETS_DIR = path.resolve(BIO_ROOT, 'public/assets')

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
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])
const MEDIA_EXT = new Set([...IMAGE_EXT, ...VIDEO_EXT])
const BIO_JSON_PATH = path.resolve(BIO_ROOT, 'public/bio.json')
const BIO_DRAFT_PATH = path.resolve(BIO_ROOT, 'public/bio.draft.json')
const AUTH_CONFIG_FILE = path.join(EDITOR_ROOT, 'php', 'auth.config.php')
const EDITOR_PHP_DIR = path.join(EDITOR_ROOT, 'php')

type EditorStoragePaths = {
  bioJsonPath: string
  draftPath: string
  assetsDir: string
  configFile: string
}

function parsePhpDefinePath(content: string, name: string, editorDir: string): string | null {
  const match = content.match(new RegExp(`define\\('${name}',\\s*([^)]+)\\)`))
  if (!match) return null
  const expr = match[1].trim()
  if (expr.startsWith("'") && expr.endsWith("'")) {
    return expr.slice(1, -1)
  }
  const rel = expr.match(/__DIR__\s*\.\s*'([^']+)'/)
  if (rel) {
    return path.resolve(editorDir, rel[1])
  }
  return null
}

function pathToPhpDefineExpr(editorDir: string, absolutePath: string): string {
  const editorReal = fs.realpathSync(editorDir)
  let targetReal: string
  try {
    targetReal = fs.realpathSync(absolutePath)
  } catch {
    targetReal = path.resolve(absolutePath)
  }
  const normalizedEditor = editorReal.replace(/\\/g, '/')
  const normalizedTarget = targetReal.replace(/\\/g, '/')
  if (
    normalizedTarget === normalizedEditor ||
    normalizedTarget.startsWith(`${normalizedEditor}/`)
  ) {
    const relative = normalizedTarget.slice(normalizedEditor.length).replace(/^\/+/, '')
    return `__DIR__ . '/${relative}'`
  }
  return `'${absolutePath.replace(/\\/g, '/')}'`
}

function getEditorStoragePaths(): EditorStoragePaths {
  const fallback: EditorStoragePaths = {
    bioJsonPath: BIO_JSON_PATH,
    draftPath: BIO_DRAFT_PATH,
    assetsDir: ASSETS_DIR,
    configFile: AUTH_CONFIG_FILE,
  }
  if (!fs.existsSync(AUTH_CONFIG_FILE)) return fallback

  const content = fs.readFileSync(AUTH_CONFIG_FILE, 'utf8')
  const bioJsonPath =
    parsePhpDefinePath(content, 'BIO_JSON_PATH', EDITOR_PHP_DIR) ?? fallback.bioJsonPath
  const assetsDir = parsePhpDefinePath(content, 'ASSETS_DIR', EDITOR_PHP_DIR) ?? fallback.assetsDir
  const draftPath = path.join(path.dirname(bioJsonPath), 'bio.draft.json')
  return { bioJsonPath, draftPath, assetsDir, configFile: AUTH_CONFIG_FILE }
}

function normalizeBioPathInput(input: string): { ok: true; path: string } | { ok: false; error: string } {
  const value = input.trim()
  if (!value) return { ok: false, error: 'Informe o caminho do bio.json' }
  if (!/\.json$/i.test(value)) return { ok: false, error: 'O caminho deve terminar em .json' }

  const resolved = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(EDITOR_PHP_DIR, value)
  const parentDir = path.dirname(resolved)
  if (!fs.existsSync(parentDir)) {
    try {
      fs.mkdirSync(parentDir, { recursive: true })
    } catch {
      return { ok: false, error: 'A pasta do arquivo não existe e não pôde ser criada' }
    }
  }
  return { ok: true, path: resolved }
}

function writeAuthConfigPaths(bioJsonPath: string, assetsDir: string) {
  const content = `<?php
// Caminhos do editor — atualizado pelo painel de configurações.
define('BIO_JSON_PATH', ${pathToPhpDefineExpr(EDITOR_PHP_DIR, bioJsonPath)});
define('ASSETS_DIR', ${pathToPhpDefineExpr(EDITOR_PHP_DIR, assetsDir)});

`
  fs.writeFileSync(AUTH_CONFIG_FILE, content, 'utf8')
}

function bioPathToRelative(absoluteBioPath: string, clientRoot: string): string {
  const bio = path.resolve(absoluteBioPath).replace(/\\/g, '/')
  const client = path.resolve(clientRoot).replace(/\\/g, '/')
  if (bio.startsWith(`${client}/`)) {
    return path.relative(client, bio).replace(/\\/g, '/')
  }
  return 'bio-json.php'
}

function buildPathsInfo(paths: EditorStoragePaths) {
  const parentDir = path.dirname(paths.bioJsonPath)
  return {
    bioJsonPath: paths.bioJsonPath.replace(/\\/g, '/'),
    assetsDir: paths.assetsDir.replace(/\\/g, '/'),
    draftPath: paths.draftPath.replace(/\\/g, '/'),
    publicBioUrl: bioPathToRelative(paths.bioJsonPath, path.resolve(EDITOR_ROOT, '..')),
    configFile: paths.configFile.replace(/\\/g, '/'),
    bioExists: fs.existsSync(paths.bioJsonPath),
    draftExists: fs.existsSync(paths.draftPath),
    writable: fs.existsSync(parentDir)
      ? (() => {
          try {
            fs.accessSync(parentDir, fs.constants.W_OK)
            return true
          } catch {
            return false
          }
        })()
      : false,
  }
}

function writeDevBioPathJson(absoluteBioPath: string) {
  const clientRoot = path.resolve(EDITOR_ROOT, '..')
  const relative = bioPathToRelative(absoluteBioPath, clientRoot)
  const payload = {
    bioJsonPath: relative,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(
    path.join(clientRoot, 'bio-path.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  )
}

function isValidAssetName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(name)
}

function readJsonFile(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
}

function jsonUsesAsset(json: string, filename: string): boolean {
  return [`assets/${filename}`, `/assets/${filename}`, filename].some((needle) =>
    json.includes(needle),
  )
}

function bioUsesAsset(filename: string): boolean {
  const { bioJsonPath, draftPath } = getEditorStoragePaths()
  for (const filePath of [bioJsonPath, draftPath]) {
    if (!fs.existsSync(filePath)) continue
    if (jsonUsesAsset(fs.readFileSync(filePath, 'utf-8'), filename)) return true
  }
  return false
}

function readRequestBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(
  res: import('http').ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/** Compara SemVer simples (a > b → 1). */
function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

function listAssetFiles(assetsDir = getEditorStoragePaths().assetsDir) {
  if (!fs.existsSync(assetsDir)) return []
  return fs
    .readdirSync(assetsDir)
    .filter((name) => {
      const full = path.join(assetsDir, name)
      if (!fs.statSync(full).isFile()) return false
      return MEDIA_EXT.has(path.extname(name).toLowerCase())
    })
    .map((name) => {
      const full = path.join(assetsDir, name)
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

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname === '/bio.draft.json' || url.pathname.endsWith('/bio.draft.json')) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Forbidden' }))
          return
        }
        if (url.pathname === '/preview' || url.pathname === '/preview/') {
          req.url = '/preview.html'
        }
        next()
      })

      server.middlewares.use('/api/bio/load', (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        const { bioJsonPath, draftPath } = getEditorStoragePaths()
        const draft = readJsonFile(draftPath)
        const published = readJsonFile(bioJsonPath)
        if (draft) {
          sendJson(res, 200, { ok: true, config: draft, source: 'draft', hasDraft: true })
          return
        }
        if (published) {
          sendJson(res, 200, {
            ok: true,
            config: published,
            source: 'published',
            hasDraft: false,
          })
          return
        }
        sendJson(res, 404, { error: 'Nenhuma configuração encontrada' })
      })

      server.middlewares.use('/api/bio/save', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        try {
          const parsed = JSON.parse(await readRequestBody(req))
          const { draftPath } = getEditorStoragePaths()
          writeJsonFile(draftPath, parsed)
          sendJson(res, 200, { ok: true, saved: 'draft' })
        } catch {
          sendJson(res, 500, { error: 'Não foi possível salvar o rascunho' })
        }
      })

      server.middlewares.use('/api/bio/publish', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        try {
          const parsed = JSON.parse(await readRequestBody(req))
          const { bioJsonPath, draftPath } = getEditorStoragePaths()
          writeJsonFile(draftPath, parsed)
          writeJsonFile(bioJsonPath, parsed)
          sendJson(res, 200, { ok: true, saved: 'published' })
        } catch {
          sendJson(res, 500, { error: 'Não foi possível publicar a bio' })
        }
      })

      server.middlewares.use('/api/bio/revert', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        try {
          const { bioJsonPath, draftPath } = getEditorStoragePaths()
          const published = readJsonFile(bioJsonPath)
          if (!published) {
            sendJson(res, 404, { error: 'Bio publicada não encontrada' })
            return
          }
          writeJsonFile(draftPath, published)
          sendJson(res, 200, { ok: true, config: published })
        } catch {
          sendJson(res, 500, { error: 'Não foi possível reverter o rascunho' })
        }
      })

      server.middlewares.use('/api/bio/paths', async (req, res) => {
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, paths: buildPathsInfo(getEditorStoragePaths()) })
          return
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          const body = JSON.parse(await readRequestBody(req)) as { bioJsonPath?: string }
          const normalized = normalizeBioPathInput(String(body.bioJsonPath ?? ''))
          if (normalized.ok === false) {
            sendJson(res, 400, { error: normalized.error })
            return
          }
          const assetsDir = path.join(path.dirname(normalized.path), 'assets')
          writeAuthConfigPaths(normalized.path, assetsDir)
          writeDevBioPathJson(normalized.path)
          const paths = getEditorStoragePaths()
          sendJson(res, 200, {
            ok: true,
            paths: buildPathsInfo(paths),
            reloadRequired: true,
          })
        } catch {
          sendJson(res, 500, { error: 'Não foi possível salvar o caminho' })
        }
      })

      // Fase B — só leitura (espelha editor/php/update-status.php)
      server.middlewares.use('/api/update/status', (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Método não permitido' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        const stateFile = path.join(EDITOR_ROOT, 'update-state.json')
        let state: {
          version: string
          updatedAt: string | null
          channel: string
          previousVersion?: string | null
        } = {
          version: 'desconhecida',
          updatedAt: null,
          channel: 'stable',
        }

        if (fs.existsSync(stateFile)) {
          try {
            const raw = JSON.parse(fs.readFileSync(stateFile, 'utf8')) as Record<string, unknown>
            state = { ...state, ...raw } as typeof state
          } catch {
            // mantém fallback
          }
        } else {
          // Dev: lê VERSION do monorepo se ainda não houver update-state.json
          const versionFile = path.resolve(EDITOR_ROOT, '../VERSION')
          if (fs.existsSync(versionFile)) {
            const v = fs.readFileSync(versionFile, 'utf8').trim()
            if (v) state = { ...state, version: v, updatedAt: null }
          }
        }

        const platformManaged =
          fs.existsSync(path.join(EDITOR_ROOT, 'platform-api.json')) ||
          fs.existsSync(path.join(EDITOR_ROOT, 'public', 'platform-api.json')) ||
          fs.existsSync(path.join(EDITOR_ROOT, 'dist', 'platform-api.json'))

        sendJson(res, 200, {
          ok: true,
          state,
          platformManaged,
        })
      })

      // Fase C/D — check/apply (dev). Disponível para todos (plataforma e self-hosted).
      server.middlewares.use('/api/update/check', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Método não permitido' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        const updatesJson = path.resolve(EDITOR_ROOT, '../dist/updates/updates.json')
        let installed = '0.0.0'
        const stateFile = path.join(EDITOR_ROOT, 'update-state.json')
        if (fs.existsSync(stateFile)) {
          try {
            const raw = JSON.parse(fs.readFileSync(stateFile, 'utf8')) as { version?: string }
            if (raw.version) installed = raw.version
          } catch {
            // ignore
          }
        } else {
          const versionFile = path.resolve(EDITOR_ROOT, '../VERSION')
          if (fs.existsSync(versionFile)) {
            const v = fs.readFileSync(versionFile, 'utf8').trim()
            if (v) installed = v
          }
        }

        if (!fs.existsSync(updatesJson)) {
          sendJson(res, 503, {
            error: 'Catálogo de atualizações indisponível. Rode: npm run build:update-package',
          })
          return
        }

        try {
          const manifest = JSON.parse(fs.readFileSync(updatesJson, 'utf8')) as {
            latest?: string
            releasedAt?: string
            changelog?: string
            packages?: Record<
              string,
              { changelog?: string; releasedAt?: string }
            >
          }
          const latest = String(manifest.latest ?? '')
          if (!latest) {
            sendJson(res, 503, { error: 'Nenhuma versão publicada ainda.' })
            return
          }
          const pkg = manifest.packages?.[latest] ?? {}
          const updateAvailable = compareSemver(latest, installed) > 0
          sendJson(res, 200, {
            ok: true,
            updateAvailable,
            installed,
            latest,
            changelog: pkg.changelog || manifest.changelog || null,
            releasedAt: pkg.releasedAt || manifest.releasedAt || null,
          })
        } catch {
          sendJson(res, 500, { error: 'Não foi possível ler o catálogo de atualizações' })
        }
      })

      // Fase D — apply (dev: mock local; atualiza só update-state.json)
      server.middlewares.use('/api/update/apply', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Método não permitido' })
          return
        }
        if (!getSessionFromRequest(req)) {
          sendJson(res, 401, { error: 'Não autenticado' })
          return
        }

        const updatesJson = path.resolve(EDITOR_ROOT, '../dist/updates/updates.json')
        if (!fs.existsSync(updatesJson)) {
          sendJson(res, 503, {
            error: 'Catálogo de atualizações indisponível. Rode: npm run build:update-package',
          })
          return
        }

        try {
          const manifest = JSON.parse(fs.readFileSync(updatesJson, 'utf8')) as {
            latest?: string
          }
          const latest = String(manifest.latest ?? '')
          if (!latest) {
            sendJson(res, 503, { error: 'Nenhuma versão publicada ainda.' })
            return
          }

          const stateFile = path.join(EDITOR_ROOT, 'update-state.json')
          let previousVersion: string | null = null
          let channel = 'stable'
          if (fs.existsSync(stateFile)) {
            try {
              const raw = JSON.parse(fs.readFileSync(stateFile, 'utf8')) as {
                version?: string
                channel?: string
              }
              previousVersion = raw.version ?? null
              channel = raw.channel ?? 'stable'
            } catch {
              // ignore
            }
          } else {
            const versionFile = path.resolve(EDITOR_ROOT, '../VERSION')
            if (fs.existsSync(versionFile)) {
              previousVersion = fs.readFileSync(versionFile, 'utf8').trim() || null
            }
          }

          if (previousVersion && compareSemver(latest, previousVersion) <= 0) {
            sendJson(res, 400, { error: 'Nenhuma atualização disponível para aplicar.' })
            return
          }

          const updatedAt = new Date().toISOString()
          const newState = {
            version: latest,
            updatedAt,
            channel,
            previousVersion,
          }
          fs.writeFileSync(stateFile, `${JSON.stringify(newState, null, 2)}\n`)

          sendJson(res, 200, {
            ok: true,
            version: latest,
            updatedAt,
            mock: true,
          })
        } catch {
          sendJson(res, 500, { error: 'Falha ao aplicar atualização (mock local)' })
        }
      })

      const handleUpload = (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
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
            const { assetsDir } = getEditorStoragePaths()

            fs.mkdirSync(assetsDir, { recursive: true })
            const filename = uniqueFilename(sanitizeFilename(name))
            fs.writeFileSync(path.join(assetsDir, filename), buffer)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: `assets/${filename}` }))
          } catch (error) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: String(error) }))
          }
        })
      }

      server.middlewares.use('/api/assets/upload', handleUpload)
      server.middlewares.use('/__upload', handleUpload)

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
            const full = path.join(getEditorStoragePaths().assetsDir, filename)
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
                  error:
                    'Arquivo em uso na bio (publicada ou rascunho). Remova das seções antes de excluir.',
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
    // Em dev servimos bio/public para o editor ler o bio.json atual.
    // No build não copiamos o site inteiro para dentro do editor.
    publicDir:
      command === 'serve'
        ? path.resolve(BIO_ROOT, 'public')
        : path.resolve(EDITOR_ROOT, 'public'),
    resolve: {
      alias: {
        '@bio-types': path.resolve(BIO_ROOT, 'src/types/bio.ts'),
        '@site': path.resolve(BIO_ROOT, 'src'),
      },
    },
    server: {
      port: 5180,
      host: true,
      strictPort: true,
      // HMR direto na 5180 mesmo quando a página é aberta via proxy do painel (5175).
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5180,
        clientPort: 5180,
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(EDITOR_ROOT, 'index.html'),
          preview: path.resolve(EDITOR_ROOT, 'preview.html'),
          demo: path.resolve(EDITOR_ROOT, 'demo.html'),
        },
      },
    },
  }
})
