import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { applyInstagramToClient, fetchInstagramProfile } from './instagram.mjs'

const PANEL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GATE_DIR = path.join(PANEL_ROOT, 'php', 'client-gate')
const DATA_DIR = path.join(PANEL_ROOT, 'data')
const DB_FILE = path.join(DATA_DIR, 'dev-db.json')
const PLATFORM_ROOT = path.join(DATA_DIR, 'platform')
const TEMPLATE_DIR = path.join(PLATFORM_ROOT, '_template')
const ROOT_TEMPLATE = path.join(PANEL_ROOT, '..', 'platform-template', '_template')

function loadReserved() {
  const raw = fs.readFileSync(path.join(PANEL_ROOT, 'php', 'reserved-slugs.php'), 'utf-8')
  const matches = [...raw.matchAll(/'([a-z0-9_-]+)'/g)]
  return new Set(matches.map((m) => m[1]))
}

const RESERVED_SLUGS = loadReserved()

const DEV_SECRET = 'dev-secret-key-nao-use-em-producao'

function appEncrypt(plain) {
  const key = crypto.createHash('sha256').update(DEV_SECRET).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  return Buffer.concat([iv, enc]).toString('base64')
}

function appDecrypt(encB64) {
  if (!encB64) return null
  try {
    const raw = Buffer.from(encB64, 'base64')
    const key = crypto.createHash('sha256').update(DEV_SECRET).digest()
    const iv = raw.subarray(0, 16)
    const data = raw.subarray(16)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(PLATFORM_ROOT, { recursive: true })
}

function ensureTemplate() {
  if (fs.existsSync(path.join(TEMPLATE_DIR, 'index.html'))) return
  if (fs.existsSync(ROOT_TEMPLATE)) {
    fs.cpSync(ROOT_TEMPLATE, TEMPLATE_DIR, { recursive: true })
    return
  }
  throw new Error('Template não encontrado. Rode: npm run build:template')
}

function readDb() {
  ensureDirs()
  if (!fs.existsSync(DB_FILE)) {
    const passwordHash = bcrypt.hashSync('admin123', 10)
    const db = {
      admins: [{ id: 1, email: 'admin@local.dev', password_hash: passwordHash }],
      clients: [],
      sessions: {},
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
    console.log('[panel dev] Admin local: admin@local.dev / admin123')
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function normalizeSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function validateSlug(slug) {
  if (slug.length < 3) return 'Slug deve ter pelo menos 3 caracteres'
  if (slug.length > 40) return 'Slug deve ter no máximo 40 caracteres'
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug)) {
    return 'Slug inválido'
  }
  if (RESERVED_SLUGS.has(slug)) return 'Slug reservado'
  return null
}

function generatePassword(length = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function isBundleFile(name) {
  return (
    /^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name) ||
    /^main-[A-Za-z0-9_-]+\.(js|css)$/.test(name) ||
    /^preview-[A-Za-z0-9_-]+\.js$/.test(name)
  )
}

function removeBundleFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (isBundleFile(name)) fs.unlinkSync(path.join(dir, name))
  }
}

function copyDirExcept(src, dest, skipNames = new Set()) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirExcept(from, to, skipNames)
    else fs.copyFileSync(from, to)
  }
}

function syncClientBioFromTemplate(clientDir, templateDir) {
  for (const name of [
    'index.html',
    'suspended.html',
    'favicon.svg',
    'icons.svg',
    'logo-instabio.svg',
  ]) {
    const src = path.join(templateDir, name)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(clientDir, name))
  }

  const tplAssets = path.join(templateDir, 'assets')
  const dstAssets = path.join(clientDir, 'assets')
  fs.mkdirSync(dstAssets, { recursive: true })
  removeBundleFiles(dstAssets)

  if (fs.existsSync(tplAssets)) {
    for (const name of fs.readdirSync(tplAssets)) {
      if (isBundleFile(name)) {
        fs.copyFileSync(path.join(tplAssets, name), path.join(dstAssets, name))
      }
    }
  }
}

function syncClientEditorFromTemplate(clientDir, templateDir) {
  const tplEditor = path.join(templateDir, 'editor')
  const dstEditor = path.join(clientDir, 'editor')
  if (!fs.existsSync(tplEditor)) return

  removeBundleFiles(path.join(dstEditor, 'assets'))
  copyDirExcept(tplEditor, dstEditor, new Set(['auth.config.php']))
}

function syncClientFromTemplate(clientDir, templateDir) {
  syncClientBioFromTemplate(clientDir, templateDir)
  syncClientEditorFromTemplate(clientDir, templateDir)
  installGateFiles(clientDir)
}

function syncAllClientsFromTemplate(db) {
  ensureTemplate()
  const result = {
    ok: true,
    template_dir: TEMPLATE_DIR,
    platform_root: PLATFORM_ROOT,
    updated: [],
    skipped: [],
    errors: [],
  }

  for (const client of db.clients) {
    const clientDir = path.join(PLATFORM_ROOT, client.slug)
    if (!fs.existsSync(clientDir)) {
      result.skipped.push({ slug: client.slug, reason: 'Pasta do cliente não encontrada' })
      continue
    }

    try {
      syncClientFromTemplate(clientDir, TEMPLATE_DIR)
      syncClientLicense(db, client)
      result.updated.push({ id: client.id, slug: client.slug, name: client.name })
    } catch (e) {
      result.errors.push({ slug: client.slug, error: String(e) })
      result.ok = false
    }
  }

  writeDb(db)
  return result
}

function generateLicenseToken() {
  return crypto.randomBytes(24).toString('hex')
}

function writeLicenseConfig(clientDir, slug, token, selfhost = false) {
  const api = 'http://localhost:5175/panel/api/license/check'
  const content = `<?php
// Gerado pelo painel — não remova. Sem este arquivo a bio não carrega.
define('LICENSE_SLUG', '${slug.replace(/'/g, "\\'")}');
define('LICENSE_TOKEN', '${token.replace(/'/g, "\\'")}');
define('LICENSE_SELFHOST', ${selfhost ? 'true' : 'false'});
define('LICENSE_API', '${api.replace(/'/g, "\\'")}');
`
  fs.writeFileSync(path.join(clientDir, 'license.config.php'), content)
}

function licenseConfigForSelfhostExport(content) {
  if (content.includes('LICENSE_SELFHOST')) {
    return content.replace(
      /define\('LICENSE_SELFHOST',\s*(?:true|false)\);/,
      "define('LICENSE_SELFHOST', true);",
    )
  }
  return content.replace(
    "define('LICENSE_API'",
    "define('LICENSE_SELFHOST', true);\ndefine('LICENSE_API'",
  )
}

function installGateFiles(clientDir) {
  fs.copyFileSync(path.join(GATE_DIR, 'index-gate.php'), path.join(clientDir, 'index.php'))
  fs.copyFileSync(path.join(GATE_DIR, 'client-license.php'), path.join(clientDir, 'client-license.php'))
  const shareMeta = path.join(GATE_DIR, 'bio-share-meta.php')
  if (fs.existsSync(shareMeta)) {
    fs.copyFileSync(shareMeta, path.join(clientDir, 'bio-share-meta.php'))
  }
  const guard = path.join(GATE_DIR, 'client-guard.php')
  const editorDir = path.join(clientDir, 'editor')
  if (fs.existsSync(guard) && fs.existsSync(editorDir)) {
    fs.copyFileSync(guard, path.join(editorDir, 'client-guard.php'))
  }
}

function clientLicenseActive(db, slug) {
  const client = findClient(db, slug)
  if (!client) return false
  if (!client.license_token) return false
  return client.status === 'active'
}

function selfHostHtaccess() {
  return `# Links na Bio — hospedagem própria do cliente
Options -Indexes -MultiViews
DirectoryIndex index.php index.html
`
}

function exportReadme(slug) {
  return `Links na Bio — pacote para hospedagem própria

Extraia na raiz do domínio. Não remova license.config.php nem index.php.
Slug: ${slug}
`
}

function createZipBuffer(clientDir, slug) {
  const tmp = fs.mkdtempSync(path.join(DATA_DIR, 'export-'))
  const staging = path.join(tmp, 'site')
  fs.cpSync(clientDir, staging, { recursive: true })
  const licensePath = path.join(staging, 'license.config.php')
  if (fs.existsSync(licensePath)) {
    const licenseContent = fs.readFileSync(licensePath, 'utf8')
    fs.writeFileSync(licensePath, licenseConfigForSelfhostExport(licenseContent))
  }
  fs.writeFileSync(path.join(staging, 'LEIA-ME.txt'), exportReadme(slug))
  fs.writeFileSync(path.join(staging, '.htaccess'), selfHostHtaccess())
  const zipPath = path.join(tmp, `bio-${slug}.zip`)
  execSync(`zip -rq ${JSON.stringify(zipPath)} .`, { cwd: staging, stdio: 'pipe' })
  const buffer = fs.readFileSync(zipPath)
  fs.rmSync(tmp, { recursive: true, force: true })
  return buffer
}

function syncClientLicense(db, client) {
  if (!client.license_token) {
    client.license_token = generateLicenseToken()
  }
  const clientDir = path.join(PLATFORM_ROOT, client.slug)
  if (!fs.existsSync(clientDir)) return
  writeLicenseConfig(clientDir, client.slug, client.license_token)
  installGateFiles(clientDir)
  writeDb(db)
}

function writeAuthConfig(editorDir, email, passwordHash) {
  const content = `<?php
define('AUTH_USERNAME', '${email.replace(/'/g, "\\'")}');
define('AUTH_PASSWORD_HASH', '${passwordHash.replace(/'/g, "\\'")}');
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');
`
  fs.writeFileSync(path.join(editorDir, 'auth.config.php'), content)
}

function customizeBio(bioPath, name) {
  const data = JSON.parse(fs.readFileSync(bioPath, 'utf-8'))
  data.brand.name = name
  data.brand.footer = `© ${new Date().getFullYear()} ${name}`
  data.brand.tagline = ''
  data.brand.location = ''
  data.brand.logo = ''
  if (data.brand.seo) {
    data.brand.seo.title = name
    data.brand.seo.description = name
  }
  if (data.brand.instagram) {
    data.brand.instagram.handle = ''
    data.brand.instagram.url = ''
  }
  delete data.brand.coverImage
  data.sections = []
  fs.writeFileSync(bioPath, `${JSON.stringify(data, null, 2)}\n`)
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) removeDir(full)
    else fs.unlinkSync(full)
  }
  fs.rmdirSync(dir)
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=')
        return i === -1 ? [p, ''] : [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]
      }),
  )
}

function getSession(req, db) {
  const token = parseCookies(req.headers.cookie).platform_dev_session
  if (!token || !db.sessions[token]) return null
  return db.sessions[token]
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function mimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('JSON inválido'))
      }
    })
  })
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])

function sanitizeFilename(name) {
  const parsed = path.parse(name)
  const base =
    parsed.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'imagem'
  const ext = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, '') || '.png'
  return `${base}${ext}`
}

function uniqueFilename(dir, filename) {
  const parsed = path.parse(filename)
  let candidate = filename
  let counter = 1
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`
    counter += 1
  }
  return candidate
}

function isValidAssetName(name) {
  return /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
}

function bioUsesAsset(bioPath, filename) {
  if (!fs.existsSync(bioPath)) return false
  const jsonText = fs.readFileSync(bioPath, 'utf-8')
  return [`assets/${filename}`, `/assets/${filename}`, filename].some((n) => jsonText.includes(n))
}

function listAssetFiles(assetsDir) {
  if (!fs.existsSync(assetsDir)) return []
  return fs
    .readdirSync(assetsDir)
    .filter((name) => {
      const full = path.join(assetsDir, name)
      return fs.statSync(full).isFile() && IMAGE_EXT.has(path.extname(name).toLowerCase())
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

function editorCookieName(slug) {
  return `editor_session_${slug.replace(/[^a-z0-9]/g, '')}`
}

function getEditorSession(req, db, slug) {
  const token = parseCookies(req.headers.cookie)[editorCookieName(slug)]
  if (!token) return null
  const sess = (db.editor_sessions ?? {})[token]
  if (!sess || sess.slug !== slug) return null
  return sess
}

function findClient(db, slug) {
  return db.clients.find((c) => c.slug === slug) ?? null
}

function isClientSuspended(db, slug) {
  const client = findClient(db, slug)
  return client?.status === 'suspended'
}

function syncClientStatus(clientRoot, status) {
  const flag = path.join(clientRoot, '.suspended')
  if (status === 'suspended') {
    fs.writeFileSync(flag, `${new Date().toISOString()}\n`)
    return
  }
  if (fs.existsSync(flag)) fs.unlinkSync(flag)
}

function serveSuspendedPage(res, clientRoot) {
  const suspendedPath = path.join(clientRoot, 'suspended.html')
  if (!fs.existsSync(suspendedPath)) {
    return json(res, 503, { error: 'Conta suspensa' })
  }
  res.statusCode = 503
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(fs.readFileSync(suspendedPath))
  return true
}

export function platformDevPlugin() {
  return {
    name: 'platform-dev',
    configureServer(server) {
      ensureDirs()
      try {
        ensureTemplate()
      } catch (e) {
        console.warn(String(e))
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')

        if (url.pathname === '/panel') {
          res.writeHead(301, { Location: '/panel/' })
          res.end()
          return
        }

        let apiPath = url.pathname
        if (apiPath.startsWith('/panel/api/')) {
          apiPath = apiPath.slice('/panel'.length)
        } else if (!apiPath.startsWith('/api/')) {
          return next()
        }

        try {
          const db = readDb()

          if (apiPath === '/api/license/check' && (req.method === 'GET' || req.method === 'POST')) {
            const body =
              req.method === 'POST'
                ? await readBody(req)
                : Object.fromEntries(url.searchParams.entries())
            const slug = normalizeSlug(String(body.slug ?? ''))
            const token = String(body.token ?? '').trim()
            const deploy = normalizeSlug(String(body.deploy ?? ''))
            if (!slug || !token) {
              return json(res, 400, { ok: false, error: 'slug e token são obrigatórios' })
            }
            const client = db.clients.find((c) => c.slug === slug && c.license_token === token)
            if (!client || (deploy && deploy !== client.slug)) {
              return json(res, 401, { ok: false, error: 'Licença inválida para esta instalação' })
            }
            return json(res, 200, {
              ok: true,
              active: client.status === 'active',
              status: client.status,
              slug: client.slug,
            })
          }

          if (apiPath === '/api/auth/session' && req.method === 'GET') {
            const session = getSession(req, db)
            return json(res, 200, {
              authenticated: Boolean(session),
              user: session?.email ?? null,
            })
          }

          if (apiPath === '/api/auth/login' && req.method === 'POST') {
            const body = await readBody(req)
            const email = String(body.email ?? '').toLowerCase().trim()
            const password = String(body.password ?? '')
            const admin = db.admins.find((a) => a.email === email)
            if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
              return json(res, 401, { error: 'E-mail ou senha inválidos' })
            }
            const token = crypto.randomBytes(24).toString('hex')
            db.sessions[token] = { adminId: admin.id, email: admin.email }
            writeDb(db)
            res.setHeader(
              'Set-Cookie',
              `platform_dev_session=${token}; Path=/; HttpOnly; SameSite=Strict`,
            )
            return json(res, 200, { ok: true, user: admin.email })
          }

          if (apiPath === '/api/auth/logout' && req.method === 'POST') {
            const token = parseCookies(req.headers.cookie).platform_dev_session
            if (token) delete db.sessions[token]
            writeDb(db)
            res.setHeader('Set-Cookie', 'platform_dev_session=; Path=/; Max-Age=0')
            return json(res, 200, { ok: true })
          }

          const session = getSession(req, db)
          if (!session) return json(res, 401, { error: 'Não autenticado' })

          if (apiPath === '/api/clients' && req.method === 'GET') {
            const clients = db.clients.map(({ password_hash, password_enc, ...rest }) => rest)
            return json(res, 200, { clients })
          }

          if (apiPath === '/api/instagram/lookup' && req.method === 'POST') {
            const body = await readBody(req)
            const handle = String(body.handle ?? '').trim()
            if (!handle) return json(res, 400, { error: 'Informe o @ do Instagram' })
            try {
              const profile = await fetchInstagramProfile(handle)
              return json(res, 200, { ok: true, profile })
            } catch (e) {
              return json(res, 502, { error: e instanceof Error ? e.message : String(e) })
            }
          }

          if (apiPath === '/api/clients/create' && req.method === 'POST') {
            ensureTemplate()
            const body = await readBody(req)
            const name = String(body.name ?? '').trim()
            const email = String(body.email ?? '').toLowerCase().trim()
            let slug = normalizeSlug(String(body.slug ?? ''))

            if (!name || !email || !slug) return json(res, 400, { error: 'Campos obrigatórios' })
            const slugError = validateSlug(slug)
            if (slugError) return json(res, 400, { error: slugError })
            if (db.clients.some((c) => c.slug === slug || c.email === email)) {
              return json(res, 409, { error: 'Slug ou e-mail já cadastrado' })
            }

            const clientDir = path.join(PLATFORM_ROOT, slug)
            if (fs.existsSync(clientDir)) {
              return json(res, 409, { error: 'Pasta já existe' })
            }

            const provided = String(body.password ?? '').trim()
            if (provided !== '' && provided.length < 6) {
              return json(res, 400, { error: 'A senha deve ter pelo menos 6 caracteres' })
            }
            const plainPassword = provided !== '' ? provided : generatePassword()
            const passwordHash = bcrypt.hashSync(plainPassword, 10)

            copyDir(TEMPLATE_DIR, clientDir)
            writeAuthConfig(path.join(clientDir, 'editor'), email, passwordHash)
            customizeBio(path.join(clientDir, 'bio.json'), name)
            const licenseToken = generateLicenseToken()
            writeLicenseConfig(clientDir, slug, licenseToken)
            installGateFiles(clientDir)

            const instagramHandle = String(body.instagram_handle ?? '').trim()
            if (instagramHandle) {
              try {
                const profile = await fetchInstagramProfile(instagramHandle)
                await applyInstagramToClient(clientDir, profile, name)
              } catch (e) {
                removeDir(clientDir)
                return json(res, 502, {
                  error: `Cliente não criado: ${e instanceof Error ? e.message : String(e)}`,
                })
              }
            }

            const client = {
              id: db.clients.length ? Math.max(...db.clients.map((c) => c.id)) + 1 : 1,
              slug,
              name,
              email,
              password_hash: passwordHash,
              password_enc: appEncrypt(plainPassword),
              license_token: licenseToken,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            db.clients.unshift(client)
            writeDb(db)

            return json(res, 200, {
              ok: true,
              client: {
                ...client,
                password: plainPassword,
                bio_url: `/${slug}/`,
                editor_url: `/${slug}/editor/`,
              },
            })
          }

          if (apiPath === '/api/clients/status' && req.method === 'POST') {
            const body = await readBody(req)
            const id = Number(body.id)
            const status = body.status
            const client = db.clients.find((c) => c.id === id)
            if (!client) return json(res, 404, { error: 'Cliente não encontrado' })
            if (!['active', 'suspended'].includes(status)) {
              return json(res, 400, { error: 'Status inválido' })
            }
            client.status = status
            client.updated_at = new Date().toISOString()
            const clientRoot = path.join(PLATFORM_ROOT, client.slug)
            if (fs.existsSync(clientRoot)) {
              syncClientStatus(clientRoot, status)
            }
            writeDb(db)
            return json(res, 200, { ok: true, status })
          }

          if (apiPath === '/api/clients/update' && req.method === 'POST') {
            const body = await readBody(req)
            const id = Number(body.id)
            const name = String(body.name ?? '').trim()
            const email = String(body.email ?? '').toLowerCase().trim()
            let slug = normalizeSlug(String(body.slug ?? ''))

            if (!id || !name || !email || !slug) {
              return json(res, 400, { error: 'Campos obrigatórios' })
            }
            const slugError = validateSlug(slug)
            if (slugError) return json(res, 400, { error: slugError })

            const client = db.clients.find((c) => c.id === id)
            if (!client) return json(res, 404, { error: 'Cliente não encontrado' })

            if (slug !== client.slug && db.clients.some((c) => c.id !== id && c.slug === slug)) {
              return json(res, 409, { error: 'Este slug já está em uso' })
            }
            if (
              email !== client.email.toLowerCase() &&
              db.clients.some((c) => c.id !== id && c.email === email)
            ) {
              return json(res, 409, { error: 'Este e-mail já está em uso' })
            }

            const oldDir = path.join(PLATFORM_ROOT, client.slug)
            const newDir = path.join(PLATFORM_ROOT, slug)
            if (!fs.existsSync(oldDir)) {
              return json(res, 404, { error: 'Pasta do cliente não encontrada' })
            }
            if (slug !== client.slug) {
              if (fs.existsSync(newDir)) {
                return json(res, 409, { error: 'Já existe uma pasta com o novo slug' })
              }
              fs.renameSync(oldDir, newDir)
            }

            const clientDir = slug !== client.slug ? newDir : oldDir
            customizeBio(path.join(clientDir, 'bio.json'), name)
            writeAuthConfig(
              path.join(clientDir, 'editor'),
              email,
              client.password_hash,
            )
            const slugChanged = slug !== client.slug
            client.slug = slug
            client.name = name
            client.email = email
            client.updated_at = new Date().toISOString()
            syncClientLicense(db, client)
            writeDb(db)

            return json(res, 200, {
              ok: true,
              client: {
                id: client.id,
                slug: client.slug,
                name: client.name,
                email: client.email,
                status: client.status,
                slug_changed: slugChanged,
                bio_url: `/${slug}/`,
                editor_url: `/${slug}/editor/`,
              },
            })
          }

          if (apiPath === '/api/clients/password' && req.method === 'POST') {
            const body = await readBody(req)
            const client = db.clients.find((c) => c.id === Number(body.id))
            if (!client) return json(res, 404, { error: 'Cliente não encontrado' })
            const password = appDecrypt(client.password_enc)
            if (password === null) {
              return json(res, 200, {
                ok: true,
                password: null,
                note: 'Senha não disponível. Use "Redefinir senha".',
              })
            }
            return json(res, 200, { ok: true, password })
          }

          if (apiPath === '/api/clients/reset-password' && req.method === 'POST') {
            const body = await readBody(req)
            const client = db.clients.find((c) => c.id === Number(body.id))
            if (!client) return json(res, 404, { error: 'Cliente não encontrado' })

            const provided = String(body.password ?? '').trim()
            if (provided !== '' && provided.length < 6) {
              return json(res, 400, { error: 'A senha deve ter pelo menos 6 caracteres' })
            }
            const plainPassword = provided !== '' ? provided : generatePassword()
            const passwordHash = bcrypt.hashSync(plainPassword, 10)

            const editorDir = path.join(PLATFORM_ROOT, client.slug, 'editor')
            if (!fs.existsSync(editorDir)) {
              return json(res, 404, { error: 'Pasta do editor não encontrada' })
            }
            writeAuthConfig(editorDir, client.email, passwordHash)

            client.password_hash = passwordHash
            client.password_enc = appEncrypt(plainPassword)
            client.updated_at = new Date().toISOString()
            writeDb(db)

            return json(res, 200, { ok: true, password: plainPassword })
          }

          if (apiPath === '/api/clients/sync-template' && req.method === 'POST') {
            ensureTemplate()
            return json(res, 200, syncAllClientsFromTemplate(db))
          }

          if (apiPath === '/api/clients/export' && req.method === 'GET') {
            const id = Number(url.searchParams.get('id'))
            const client = db.clients.find((c) => c.id === id)
            if (!client) return json(res, 404, { error: 'Cliente não encontrado' })
            const clientDir = path.join(PLATFORM_ROOT, client.slug)
            if (!fs.existsSync(clientDir)) {
              return json(res, 404, { error: 'Pasta do cliente não encontrada' })
            }
            syncClientLicense(db, client)
            const zip = createZipBuffer(clientDir, client.slug)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/zip')
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="bio-${client.slug}.zip"`,
            )
            res.end(zip)
            return
          }

          if (apiPath === '/api/clients/delete' && req.method === 'POST') {
            const body = await readBody(req)
            const id = Number(body.id)
            const idx = db.clients.findIndex((c) => c.id === id)
            if (idx === -1) return json(res, 404, { error: 'Cliente não encontrado' })
            const client = db.clients[idx]
            removeDir(path.join(PLATFORM_ROOT, client.slug))
            db.clients.splice(idx, 1)
            writeDb(db)
            return json(res, 200, { ok: true })
          }

          return json(res, 404, { error: 'Rota não encontrada' })
        } catch (e) {
          return json(res, 500, { error: String(e) })
        }
      })

      // Emula os endpoints PHP do editor de cada cliente em dev:
      // /{slug}/editor/{session,login,logout,save,upload,list-images,delete-image}.php
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length < 3 || parts[1] !== 'editor') return next()

        const slug = parts[0]
        if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()

        const file = parts[parts.length - 1]
        if (!file.endsWith('.php')) return next()

        const clientRoot = path.join(PLATFORM_ROOT, slug)
        if (!fs.existsSync(clientRoot)) return next()

        const bioPath = path.join(clientRoot, 'bio.json')
        const assetsDir = path.join(clientRoot, 'assets')

        try {
          const db = readDb()
          if (!clientLicenseActive(db, slug)) {
            return json(res, 503, {
              error: 'Conta suspensa ou licença inválida.',
              suspended: true,
            })
          }
          if (isClientSuspended(db, slug)) {
            return json(res, 503, {
              error: 'Conta suspensa. Entre em contato com o suporte.',
              suspended: true,
            })
          }

          db.editor_sessions ??= {}

          if (file === 'session.php' && req.method === 'GET') {
            const sess = getEditorSession(req, db, slug)
            return json(res, 200, { authenticated: Boolean(sess), user: sess?.email ?? null })
          }

          if (file === 'login.php' && req.method === 'POST') {
            const body = await readBody(req)
            const username = String(body.username ?? '').toLowerCase().trim()
            const password = String(body.password ?? '')
            const client = db.clients.find((c) => c.slug === slug)
            if (
              !client ||
              client.email.toLowerCase() !== username ||
              !bcrypt.compareSync(password, client.password_hash)
            ) {
              return json(res, 401, { error: 'Usuário ou senha inválidos' })
            }
            const token = crypto.randomBytes(24).toString('hex')
            db.editor_sessions[token] = { slug, email: client.email }
            writeDb(db)
            res.setHeader(
              'Set-Cookie',
              `${editorCookieName(slug)}=${token}; Path=/${slug}/editor/; HttpOnly; SameSite=Lax; Max-Age=604800`,
            )
            return json(res, 200, { ok: true, user: client.email })
          }

          if (file === 'logout.php' && req.method === 'POST') {
            const token = parseCookies(req.headers.cookie)[editorCookieName(slug)]
            if (token && db.editor_sessions[token]) {
              delete db.editor_sessions[token]
              writeDb(db)
            }
            res.setHeader(
              'Set-Cookie',
              `${editorCookieName(slug)}=; Path=/${slug}/editor/; HttpOnly; SameSite=Lax; Max-Age=0`,
            )
            return json(res, 200, { ok: true })
          }

          // Endpoints protegidos
          if (!getEditorSession(req, db, slug)) {
            return json(res, 401, { error: 'Não autenticado' })
          }

          if (file === 'save.php' && req.method === 'POST') {
            const body = await readBody(req)
            fs.writeFileSync(bioPath, `${JSON.stringify(body, null, 2)}\n`, 'utf-8')
            return json(res, 200, { ok: true })
          }

          if (file === 'upload.php' && req.method === 'POST') {
            const body = await readBody(req)
            const raw = String(body.data ?? '')
            const base64 = raw.includes(',') ? raw.split(',')[1] : raw
            const buffer = Buffer.from(base64, 'base64')
            if (buffer.length === 0) return json(res, 400, { error: 'Imagem inválida' })
            fs.mkdirSync(assetsDir, { recursive: true })
            const filename = uniqueFilename(
              assetsDir,
              sanitizeFilename(String(body.name ?? 'imagem.png')),
            )
            fs.writeFileSync(path.join(assetsDir, filename), buffer)
            return json(res, 200, { path: `assets/${filename}` })
          }

          if (file === 'list-images.php' && req.method === 'GET') {
            return json(res, 200, { files: listAssetFiles(assetsDir) })
          }

          if (file === 'delete-image.php' && req.method === 'POST') {
            const body = await readBody(req)
            const filename = path.basename(String(body.name ?? ''))
            if (!isValidAssetName(filename)) {
              return json(res, 400, { error: 'Nome de arquivo inválido' })
            }
            const full = path.join(assetsDir, filename)
            if (!fs.existsSync(full)) return json(res, 404, { error: 'Arquivo não encontrado' })
            if (bioUsesAsset(bioPath, filename)) {
              return json(res, 409, {
                error: 'Imagem em uso na bio. Remova das seções antes de excluir.',
              })
            }
            fs.unlinkSync(full)
            return json(res, 200, { ok: true })
          }

          return next()
        } catch (e) {
          return json(res, 500, { error: String(e) })
        }
      })

      // Servir tenants criados em dev em /{slug}/ e /{slug}/editor/
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length === 0) return next()

        const slug = parts[0]
        if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()

        const clientRoot = path.join(PLATFORM_ROOT, slug)
        if (!fs.existsSync(clientRoot)) return next()

        const db = readDb()
        const relParts = parts.slice(1)
        const relPath = relParts.join('/')

        const licenseConfig = path.join(clientRoot, 'license.config.php')
        if (!fs.existsSync(licenseConfig) || !clientLicenseActive(db, slug)) {
          if (relPath !== 'suspended.html') {
            serveSuspendedPage(res, clientRoot)
            return
          }
        }

        if (isClientSuspended(db, slug) && relPath !== 'suspended.html') {
          serveSuspendedPage(res, clientRoot)
          return
        }

        let candidate = parts.length === 1
          ? path.join(clientRoot, 'index.html')
          : path.join(clientRoot, ...parts.slice(1))

        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          candidate = path.join(candidate, 'index.html')
        } else if (!fs.existsSync(candidate) && !path.extname(candidate)) {
          candidate = path.join(candidate, 'index.html')
        }

        if (!candidate.startsWith(clientRoot) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
          return next()
        }

        res.statusCode = 200
        res.setHeader('Content-Type', mimeType(candidate))
        res.end(fs.readFileSync(candidate))
      })
    },
  }
}
