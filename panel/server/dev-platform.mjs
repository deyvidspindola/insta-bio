import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { applyInstagramToClient, fetchInstagramProfile } from './instagram.mjs'
import { zipDirectoryToBuffer } from './zip-buffer.mjs'
import {
  isViteBundleFile,
  removeEditorAssetBundles,
  removeViteBundles,
} from '../../scripts/lib/vite-bundles.mjs'

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

function compareSemverDev(a, b) {
  const pa = String(a).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

function ensureTemplate({ force = false } = {}) {
  if (!fs.existsSync(ROOT_TEMPLATE) || !fs.existsSync(path.join(ROOT_TEMPLATE, 'index.html'))) {
    if (fs.existsSync(path.join(TEMPLATE_DIR, 'index.html'))) return
    throw new Error('Template não encontrado. Rode: npm run build:template')
  }

  const rootIndex = path.join(ROOT_TEMPLATE, 'index.html')
  const localIndex = path.join(TEMPLATE_DIR, 'index.html')
  const needsCopy =
    force ||
    !fs.existsSync(localIndex) ||
    fs.statSync(rootIndex).mtimeMs > fs.statSync(localIndex).mtimeMs

  if (!needsCopy) return

  fs.rmSync(TEMPLATE_DIR, { recursive: true, force: true })
  fs.cpSync(ROOT_TEMPLATE, TEMPLATE_DIR, { recursive: true })
  console.log('[panel dev] Template atualizado a partir de platform-template/_template')
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
  removeViteBundles(dstAssets)

  if (fs.existsSync(tplAssets)) {
    for (const name of fs.readdirSync(tplAssets)) {
      if (isViteBundleFile(name)) {
        fs.copyFileSync(path.join(tplAssets, name), path.join(dstAssets, name))
      }
    }
  }
}

function syncClientEditorFromTemplate(clientDir, templateDir) {
  const tplEditor = path.join(templateDir, 'editor')
  const dstEditor = path.join(clientDir, 'editor')
  if (!fs.existsSync(tplEditor)) return

  removeEditorAssetBundles(path.join(dstEditor, 'assets'))
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

function normalizeLicenseHost(host) {
  let value = String(host ?? '').trim().toLowerCase()
  if (!value) return ''
  if (value.includes('://')) {
    try {
      value = new URL(value).hostname.toLowerCase()
    } catch {
      return ''
    }
  }
  value = value.replace(/\/$/, '')
  if (value.includes(':')) value = value.split(':', 1)[0]
  if (value.startsWith('www.')) value = value.slice(4)
  return value
}

function validateLicenseHost(host) {
  const normalized = normalizeLicenseHost(host)
  if (!normalized) return 'Informe o domínio (ex.: cliente.com.br)'
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(normalized)) return 'Domínio inválido'
  return null
}

function normalizeDeployPath(path) {
  let value = String(path ?? '').trim().toLowerCase()
  if (!value || value === '/' || value === '.' || value === 'raiz' || value === 'root') return ''
  value = value.replace(/^\/+|\/+$/g, '')
  if (!value) return ''
  return normalizeSlug(value)
}

function deployPathLabel(path) {
  const normalized = normalizeDeployPath(path ?? '')
  return normalized === '' ? '/' : normalized
}

function validateDeployPath(path) {
  const raw = String(path ?? '').trim()
  if (!raw) return 'Informe a pasta no domínio (use / para a raiz)'
  const normalized = normalizeDeployPath(raw)
  if (normalized === '' && !['/', '.', 'raiz', 'root'].includes(raw.toLowerCase())) {
    return 'Pasta inválida — use letras, números e hífens (ou / para raiz)'
  }
  return null
}

function resolveClientHostingInput(selfHosted, allowedHostInput, deployPathInput) {
  if (!selfHosted) {
    return { self_hosted: false, allowed_host: null, deploy_path: null }
  }

  const allowedHost = normalizeLicenseHost(allowedHostInput)
  if (!allowedHost) {
    throw new Error('Informe o domínio autorizado para hospedagem própria')
  }
  const hostError = validateLicenseHost(allowedHost)
  if (hostError) throw new Error(hostError)

  const pathError = validateDeployPath(deployPathInput)
  if (pathError) throw new Error(pathError)

  return {
    self_hosted: true,
    allowed_host: allowedHost,
    deploy_path: normalizeDeployPath(deployPathInput),
  }
}

const ROOT_FOLDER_NAMES = new Set(['public_html', 'htdocs', 'www', 'httpdocs', 'html'])

function deployPathMatchesRequest(expectedPath, requestDeploy) {
  const expected = normalizeDeployPath(expectedPath ?? '')
  const request = normalizeSlug(requestDeploy ?? '')
  if (!expected) {
    if (!request) return true
    return ROOT_FOLDER_NAMES.has(request)
  }
  return request !== '' && request === expected
}

function buildLicenseConfigContent(slug, token, { selfhost = false, allowedHost = '', deployPath = '' } = {}) {
  const api = 'http://localhost:5175/panel/api/license/check'
  const allowed = normalizeLicenseHost(allowedHost)
  const allowedLine = allowed ? `define('LICENSE_ALLOWED_HOST', '${allowed.replace(/'/g, "\\'")}');\n` : ''
  const deploy = normalizeDeployPath(deployPath)
  const deployLine = selfhost
    ? `define('LICENSE_DEPLOY_PATH', '${deploy.replace(/'/g, "\\'")}');\n`
    : ''
  return `<?php
// Gerado pelo painel — não remova. Sem este arquivo a bio não carrega.
define('LICENSE_SLUG', '${slug.replace(/'/g, "\\'")}');
define('LICENSE_TOKEN', '${token.replace(/'/g, "\\'")}');
define('LICENSE_SELFHOST', ${selfhost ? 'true' : 'false'});
${allowedLine}${deployLine}define('LICENSE_API', '${api.replace(/'/g, "\\'")}');
`
}

function writeLicenseConfig(clientDir, slug, token, options = {}) {
  const content = buildLicenseConfigContent(slug, token, options)
  fs.writeFileSync(path.join(clientDir, 'license.config.php'), content)
}

function selfHostHtaccess() {
  return `# Links na Bio — hospedagem própria do cliente
Options -Indexes -MultiViews
DirectoryIndex index.php index.html

<Files "license.config.php">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>

<Files ".license-cache.json">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>

<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{REQUEST_URI} !/suspended\\.html$ [NC]
  RewriteCond .suspended -f
  RewriteRule ^ suspended.html [L]

  RewriteRule ^editor$ editor/ [R=301,L]
  RewriteRule ^index\\.html$ index.php [L]
</IfModule>

<Files "bio.draft.json">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>
`
}

function exportReadme(slug, allowedHost, deployPath, bioSource = 'published') {
  const folder = deployPathLabel(deployPath)
  const bioNote =
    bioSource === 'draft'
      ? '9. Atenção: a bio publicada estava vazia — o ZIP incluiu o rascunho do editor.\n'
      : `9. O ZIP inclui a bio publicada (a mesma exibida em /${slug}/ na plataforma).\n`

  return `Links na Bio — pacote para hospedagem própria

1. Extraia na pasta autorizada do domínio cadastrado.
2. Domínio autorizado: ${allowedHost}
3. Pasta no domínio: ${folder}
4. Abra verificar-ambiente.php para testar servidor, domínio, pasta e API de licença.
5. Não remova license.config.php nem index.php.

Slug no painel: ${slug}
${bioNote}`
}

function readBioJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

function bioHasContent(data) {
  if (!data || typeof data !== 'object') return false
  if (Array.isArray(data.sections) && data.sections.length > 0) return true
  const brand = data.brand ?? {}
  return Boolean(brand.logo || brand.tagline || brand.location || brand.coverImage)
}

function resolveClientExportBio(clientDir) {
  const published = readBioJson(path.join(clientDir, 'bio.json'))
  const draft = readBioJson(path.join(clientDir, 'bio.draft.json'))

  let chosen
  let source
  if (bioHasContent(published)) {
    chosen = published
    source = 'published'
  } else if (bioHasContent(draft)) {
    chosen = draft
    source = 'draft'
  } else if (published) {
    chosen = published
    source = 'published'
  } else if (draft) {
    chosen = draft
    source = 'draft'
  } else {
    throw new Error(
      'Nenhuma configuração da bio encontrada. Edite e publique a bio no editor antes de exportar.',
    )
  }

  return {
    content: `${JSON.stringify(chosen, null, 2)}\n`,
    source,
  }
}

function createZipBuffer(clientDir, client) {
  const slug = client.slug
  if (!client.self_hosted) {
    throw new Error(
      'Este cliente está configurado só na plataforma. Ative "Hospedagem própria" para exportar o ZIP.',
    )
  }

  const allowedHost = normalizeLicenseHost(client.allowed_host ?? '')
  if (!allowedHost) {
    throw new Error('Configure o domínio autorizado do cliente antes de exportar o ZIP.')
  }
  if (client.deploy_path === null || client.deploy_path === undefined) {
    throw new Error('Configure a pasta no domínio antes de exportar o ZIP.')
  }

  const deployPath = normalizeDeployPath(client.deploy_path ?? '')
  const exportBio = resolveClientExportBio(clientDir)

  const tmp = fs.mkdtempSync(path.join(DATA_DIR, 'export-'))
  const staging = path.join(tmp, 'site')
  fs.cpSync(clientDir, staging, { recursive: true })
  fs.writeFileSync(path.join(staging, 'bio.json'), exportBio.content)
  const draftPath = path.join(staging, 'bio.draft.json')
  if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath)
  const editorAuth = path.join(staging, 'editor', 'auth.config.php')
  if (fs.existsSync(path.dirname(editorAuth))) {
    const editorDir = path.join(staging, 'editor')
    writeAuthConfig(editorDir)
    writePlatformApiJson(editorDir, slug, client.license_token)
    const editorHtaccess = path.join(PANEL_ROOT, '..', 'deploy', 'apache', 'editor.htaccess')
    if (fs.existsSync(editorHtaccess)) {
      fs.copyFileSync(editorHtaccess, path.join(editorDir, '.htaccess'))
    }
  }
  fs.writeFileSync(
    path.join(staging, 'license.config.php'),
    buildLicenseConfigContent(slug, client.license_token, {
      selfhost: true,
      allowedHost,
      deployPath,
    }),
  )
  fs.writeFileSync(path.join(staging, 'LEIA-ME.txt'), exportReadme(slug, allowedHost, deployPath, exportBio.source))
  fs.writeFileSync(path.join(staging, '.htaccess'), selfHostHtaccess())
  const verify = path.join(GATE_DIR, 'verificar-ambiente.php')
  if (fs.existsSync(verify)) {
    fs.copyFileSync(verify, path.join(staging, 'verificar-ambiente.php'))
  }

  const buffer = zipDirectoryToBuffer(staging)
  fs.rmSync(tmp, { recursive: true, force: true })
  return buffer
}

function syncClientLicense(db, client) {
  if (!client.license_token) {
    client.license_token = generateLicenseToken()
  }
  const clientDir = path.join(PLATFORM_ROOT, client.slug)
  if (!fs.existsSync(clientDir)) return
  writeLicenseConfig(clientDir, client.slug, client.license_token, {
    selfhost: Boolean(client.self_hosted),
    allowedHost: client.self_hosted ? client.allowed_host ?? '' : '',
    deployPath: client.self_hosted ? client.deploy_path ?? '' : '',
  })
  installGateFiles(clientDir)
  const editorDir = path.join(clientDir, 'editor')
  if (fs.existsSync(editorDir)) {
    writeAuthConfig(editorDir)
    writePlatformApiJson(editorDir, client.slug, client.license_token)
  }
  writeDb(db)
}

function lookupClientLicense(db, slug, token, deploy = '', requestHost = '') {
  const client = db.clients.find((c) => c.slug === slug && c.license_token === token)
  if (!client) return null

  if (client.self_hosted) {
    const allowedHost = normalizeLicenseHost(client.allowed_host ?? '')
    if (allowedHost) {
      const host = normalizeLicenseHost(requestHost)
      if (!host || host !== allowedHost) return null
    }
    if (!deployPathMatchesRequest(client.deploy_path ?? '', deploy)) return null
  } else {
    const deploySlug = normalizeSlug(deploy)
    if (deploySlug && deploySlug !== client.slug) return null
  }

  return client
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
  const verify = path.join(GATE_DIR, 'verificar-ambiente.php')
  if (fs.existsSync(verify)) {
    fs.copyFileSync(verify, path.join(clientDir, 'verificar-ambiente.php'))
  }
  const bioJson = path.join(GATE_DIR, 'bio-json.php')
  if (fs.existsSync(bioJson)) {
    fs.copyFileSync(bioJson, path.join(clientDir, 'bio-json.php'))
  }
}

function clientLicenseActive(db, slug) {
  const client = findClient(db, slug)
  if (!client) return false
  if (!client.license_token) return false
  return client.status === 'active'
}

function writeAuthConfig(editorDir) {
  const content = `<?php
// Caminhos do editor — credenciais vêm do painel via API.
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');
`
  fs.writeFileSync(path.join(editorDir, 'auth.config.php'), content)
}

function devPlatformPublicUrl() {
  return `http://localhost:${process.env.PORT || 5175}`
}

function writePlatformApiJson(editorDir, slug, token, platformBaseUrl = devPlatformPublicUrl()) {
  const apiBase = `${String(platformBaseUrl).replace(/\/$/, '')}/panel/api`
  const payload = {
    remoteAuth: true,
    loginUrl: `${apiBase}/editor/login`,
    sessionUrl: `${apiBase}/editor/session`,
    slug,
    token,
  }
  fs.writeFileSync(
    path.join(editorDir, 'platform-api.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  )
}

function lookupClientEditor(db, slug, token, email, password = '') {
  const client = db.clients.find((c) => c.slug === slug && c.license_token === token)
  if (!client || client.status !== 'active') return null
  if (client.email.toLowerCase() !== String(email).toLowerCase().trim()) return null
  if (password && !bcrypt.compareSync(password, client.password_hash)) return null
  return client
}

function createEditorHandshake(token, email, slug) {
  const nonce = crypto.randomBytes(16).toString('hex')
  const normalizedEmail = String(email).toLowerCase().trim()
  const sig = crypto
    .createHmac('sha256', token)
    .update(`${nonce}|${normalizedEmail}|${slug}`)
    .digest('hex')
  return { nonce, sig }
}

function verifyEditorHandshake(token, email, slug, nonce, sig) {
  if (!nonce || !sig) return false
  const normalizedEmail = String(email).toLowerCase().trim()
  const expected = crypto
    .createHmac('sha256', token)
    .update(`${nonce}|${normalizedEmail}|${slug}`)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'))
  } catch {
    return false
  }
}

function readClientLicenseConfig(clientRoot) {
  const licensePath = path.join(clientRoot, 'license.config.php')
  if (!fs.existsSync(licensePath)) return null
  const content = fs.readFileSync(licensePath, 'utf8')
  const slugMatch = content.match(/define\('LICENSE_SLUG',\s*'([^']+)'\)/)
  const tokenMatch = content.match(/define\('LICENSE_TOKEN',\s*'([^']+)'\)/)
  const apiMatch = content.match(/define\('LICENSE_API',\s*'([^']+)'\)/)
  const selfhost = /define\('LICENSE_SELFHOST',\s*true\)/.test(content)
  if (!slugMatch || !tokenMatch || !apiMatch) return null
  return {
    slug: slugMatch[1],
    token: tokenMatch[1],
    api: apiMatch[1],
    selfhost,
  }
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
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])
const MEDIA_EXT = new Set([...IMAGE_EXT, ...VIDEO_EXT])

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
  return /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(name)
}

function bioUsesAsset(bioPath, filename) {
  if (!fs.existsSync(bioPath)) return false
  const jsonText = fs.readFileSync(bioPath, 'utf-8')
  return [`assets/${filename}`, `/assets/${filename}`, filename].some((n) => jsonText.includes(n))
}

function clientBioUsesAsset(clientRoot, filename) {
  return (
    bioUsesAsset(path.join(clientRoot, 'bio.json'), filename) ||
    bioUsesAsset(path.join(clientRoot, 'bio.draft.json'), filename)
  )
}

function listAssetFiles(assetsDir) {
  if (!fs.existsSync(assetsDir)) return []
  return fs
    .readdirSync(assetsDir)
    .filter((name) => {
      const full = path.join(assetsDir, name)
      return fs.statSync(full).isFile() && MEDIA_EXT.has(path.extname(name).toLowerCase())
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

const EDITOR_DEV_PORT = Number(process.env.EDITOR_DEV_PORT || 5180)
// Proxy Vite sob /{slug}/editor/ é frágil (imports absolutos /@vite, /src, /node_modules).
// Padrão: build estático sincronizado por ensure-dev-builds. Opt-in: EDITOR_DEV_PROXY=1
const EDITOR_DEV_PROXY = process.env.EDITOR_DEV_PROXY === '1'

const EDITOR_LOCAL_FILES = new Set([
  'platform-api.json',
  'auth.config.php',
  'client-guard.php',
])

function isViteDevAssetPath(pathname) {
  return (
    pathname.startsWith('/@') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname === '/vite.svg'
  )
}

function editorSlugFromReferer(referer = '') {
  try {
    const ref = new URL(referer)
    const parts = ref.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && parts[1] === 'editor') return parts[0]
  } catch {
    // ignore
  }
  return null
}

function proxyToEditorDev(req, res, targetPathname) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const target = new URL(targetPathname + url.search, `http://127.0.0.1:${EDITOR_DEV_PORT}`)

  const headers = { ...req.headers, host: `127.0.0.1:${EDITOR_DEV_PORT}` }
  delete headers['accept-encoding']

  const proxyReq = http.request(
    target,
    { method: req.method, headers },
    (proxyRes) => {
      const contentType = String(proxyRes.headers['content-type'] ?? '')
      // Só reescreve documentos HTML reais — nunca /@vite/client, /src/*, etc.
      const looksLikeHtmlDoc =
        contentType.includes('text/html') &&
        (targetPathname === '/' ||
          targetPathname === '' ||
          targetPathname.endsWith('.html') ||
          targetPathname.endsWith('/'))

      if (!looksLikeHtmlDoc) {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
        proxyRes.pipe(res)
        return
      }

      // HTML do Vite usa paths absolutos (/@vite/client, /src/...).
      // Reescreve para /{slug}/editor/... quando a página está sob o painel.
      const chunks = []
      proxyRes.on('data', (chunk) => chunks.push(chunk))
      proxyRes.on('end', () => {
        let body = Buffer.concat(chunks).toString('utf8')
        const parts = url.pathname.split('/').filter(Boolean)
        const slug = parts[0]
        if (slug && parts[1] === 'editor') {
          const prefix = `/${slug}/editor`
          body = body
            .replace(/(src|href)=["']\//g, `$1="${prefix}/`)
            .replace(/(from |import\()["']\//g, `$1"${prefix}/`)
        }
        const outHeaders = { ...proxyRes.headers }
        delete outHeaders['content-length']
        res.writeHead(proxyRes.statusCode ?? 200, outHeaders)
        res.end(body)
      })
    },
  )
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(
        `Editor dev (porta ${EDITOR_DEV_PORT}) não está rodando.\nRode: npm run editor ou make dev-all`,
      )
    }
  })
  req.pipe(proxyReq)
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
            const host = normalizeLicenseHost(String(body.host ?? ''))
            if (!slug || !token) {
              return json(res, 400, { ok: false, error: 'slug e token são obrigatórios' })
            }
            const client = lookupClientLicense(db, slug, token, deploy, host)
            if (!client) {
              return json(res, 401, { ok: false, error: 'Licença inválida para esta instalação' })
            }
            return json(res, 200, {
              ok: true,
              active: client.status === 'active',
              status: client.status,
              slug: client.slug,
            })
          }

          if (apiPath === '/api/updates/check' && (req.method === 'GET' || req.method === 'POST')) {
            const body =
              req.method === 'POST'
                ? await readBody(req)
                : Object.fromEntries(url.searchParams.entries())
            const slug = normalizeSlug(String(body.slug ?? ''))
            const token = String(body.token ?? '').trim()
            const deploy = normalizeSlug(String(body.deploy ?? ''))
            const host = normalizeLicenseHost(String(body.host ?? ''))
            let installed = String(body.installed ?? '0.0.0').trim() || '0.0.0'
            if (installed === 'desconhecida') installed = '0.0.0'
            if (!slug || !token) {
              return json(res, 400, { ok: false, error: 'slug e token são obrigatórios' })
            }
            const client = lookupClientLicense(db, slug, token, deploy, host)
            if (!client) {
              return json(res, 401, { ok: false, error: 'Licença inválida para esta instalação' })
            }
            if (client.status !== 'active') {
              return json(res, 403, {
                ok: false,
                error: 'Conta suspensa. Atualizações indisponíveis.',
                status: client.status,
              })
            }

            const manifestPaths = [
              path.join(DATA_DIR, 'updates', 'updates.json'),
              path.join(PANEL_ROOT, '..', 'dist', 'updates', 'updates.json'),
            ]
            let manifest = null
            for (const p of manifestPaths) {
              if (!fs.existsSync(p)) continue
              try {
                manifest = JSON.parse(fs.readFileSync(p, 'utf8'))
                if (manifest?.latest) break
              } catch {
                manifest = null
              }
            }
            if (!manifest?.latest) {
              return json(res, 503, {
                ok: false,
                error: 'Catálogo de atualizações indisponível no servidor.',
              })
            }

            const latest = String(manifest.latest)
            const pkg = manifest.packages?.[latest] ?? {}
            const updateAvailable = compareSemverDev(latest, installed) > 0
            return json(res, 200, {
              ok: true,
              updateAvailable,
              installed,
              latest,
              changelog: pkg.changelog || manifest.changelog || null,
              releasedAt: pkg.releasedAt || manifest.releasedAt || null,
              slug: client.slug,
            })
          }

          if (apiPath === '/api/updates/package' && (req.method === 'GET' || req.method === 'POST')) {
            const body =
              req.method === 'POST'
                ? await readBody(req)
                : Object.fromEntries(url.searchParams.entries())
            const slug = normalizeSlug(String(body.slug ?? ''))
            const token = String(body.token ?? '').trim()
            const deploy = normalizeSlug(String(body.deploy ?? ''))
            const host = normalizeLicenseHost(String(body.host ?? ''))
            if (!slug || !token) {
              return json(res, 400, { ok: false, error: 'slug e token são obrigatórios' })
            }
            const client = lookupClientLicense(db, slug, token, deploy, host)
            if (!client) {
              return json(res, 401, { ok: false, error: 'Licença inválida para esta instalação' })
            }
            if (client.status !== 'active') {
              return json(res, 403, {
                ok: false,
                error: 'Conta suspensa. Atualizações indisponíveis.',
                status: client.status,
              })
            }

            const manifestPaths = [
              path.join(DATA_DIR, 'updates', 'updates.json'),
              path.join(PANEL_ROOT, '..', 'dist', 'updates', 'updates.json'),
            ]
            let manifest = null
            let updatesDir = null
            for (const p of manifestPaths) {
              if (!fs.existsSync(p)) continue
              try {
                manifest = JSON.parse(fs.readFileSync(p, 'utf8'))
                if (manifest?.latest) {
                  updatesDir = path.dirname(p)
                  break
                }
              } catch {
                manifest = null
              }
            }
            if (!manifest?.latest || !updatesDir) {
              return json(res, 503, {
                ok: false,
                error: 'Catálogo de atualizações indisponível no servidor.',
              })
            }

            const latest = String(manifest.latest)
            const pkg = manifest.packages?.[latest] ?? null
            if (!pkg) {
              return json(res, 503, { ok: false, error: 'Pacote da última versão não disponível.' })
            }

            const zipName = path.basename(String(pkg.url ?? ''))
            if (!/^insta-bio-\d+\.\d+\.\d+\.zip$/.test(zipName)) {
              return json(res, 503, { ok: false, error: 'Nome de pacote inválido no manifesto.' })
            }
            const zipPath = path.join(updatesDir, zipName)
            if (!fs.existsSync(zipPath)) {
              return json(res, 503, { ok: false, error: 'Arquivo ZIP não encontrado no servidor.' })
            }

            const expires = Math.floor(Date.now() / 1000) + 300
            const signature = crypto
              .createHmac('sha256', DEV_SECRET)
              .update(`${zipName}|${expires}`)
              .digest('hex')
            const hostHeader = req.headers.host || 'localhost:5175'
            const proto = req.headers['x-forwarded-proto'] || 'http'
            const signedUrl = `${proto}://${hostHeader}/panel/api/updates/download?file=${encodeURIComponent(zipName)}&expires=${expires}&signature=${signature}`

            let sha256 = String(pkg.sha256 ?? '')
            if (!/^[a-f0-9]{64}$/.test(sha256)) {
              sha256 = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex')
            }

            return json(res, 200, {
              ok: true,
              url: signedUrl,
              sha256,
              version: latest,
              size: Number(pkg.size ?? fs.statSync(zipPath).size),
              expiresAt: new Date(expires * 1000).toISOString(),
              slug: client.slug,
            })
          }

          if (apiPath === '/api/updates/download' && req.method === 'GET') {
            const zipName = String(url.searchParams.get('file') ?? '')
            const expires = Number(url.searchParams.get('expires') ?? 0)
            const signature = String(url.searchParams.get('signature') ?? '').toLowerCase()
            if (!/^insta-bio-\d+\.\d+\.\d+\.zip$/.test(zipName) || !expires || !signature) {
              return json(res, 400, { ok: false, error: 'Parâmetros de download inválidos.' })
            }
            if (expires < Math.floor(Date.now() / 1000)) {
              return json(res, 403, { ok: false, error: 'Link de download inválido ou expirado.' })
            }
            const expected = crypto
              .createHmac('sha256', DEV_SECRET)
              .update(`${zipName}|${expires}`)
              .digest('hex')
            try {
              const ok = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
              if (!ok) {
                return json(res, 403, { ok: false, error: 'Link de download inválido ou expirado.' })
              }
            } catch {
              return json(res, 403, { ok: false, error: 'Link de download inválido ou expirado.' })
            }

            const candidates = [
              path.join(DATA_DIR, 'updates', zipName),
              path.join(PANEL_ROOT, '..', 'dist', 'updates', zipName),
            ]
            const zipPath = candidates.find((p) => fs.existsSync(p))
            if (!zipPath) {
              return json(res, 404, { ok: false, error: 'Pacote não encontrado.' })
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/zip')
            res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`)
            res.setHeader('Cache-Control', 'no-store')
            fs.createReadStream(zipPath).pipe(res)
            return true
          }

          if (apiPath === '/api/editor/login' && req.method === 'POST') {
            const body = await readBody(req)
            const slug = normalizeSlug(String(body.slug ?? ''))
            const token = String(body.token ?? '').trim()
            const email = String(body.email ?? body.username ?? '')
              .toLowerCase()
              .trim()
            const password = String(body.password ?? '')
            if (!slug || !token || !email || !password) {
              return json(res, 400, { ok: false, error: 'slug, token, e-mail e senha são obrigatórios' })
            }
            const client = lookupClientEditor(db, slug, token, email, password)
            if (!client) {
              return json(res, 401, { ok: false, error: 'E-mail ou senha inválidos' })
            }
            const handshake = createEditorHandshake(token, client.email, client.slug)
            return json(res, 200, {
              ok: true,
              user: client.email,
              slug: client.slug,
              ...handshake,
            })
          }

          if (apiPath === '/api/editor/session' && req.method === 'POST') {
            const body = await readBody(req)
            const slug = normalizeSlug(String(body.slug ?? ''))
            const token = String(body.token ?? '').trim()
            const email = String(body.email ?? body.username ?? '')
              .toLowerCase()
              .trim()
            if (!slug || !token || !email) {
              return json(res, 400, { ok: false, valid: false, error: 'Campos obrigatórios' })
            }
            const client = lookupClientEditor(db, slug, token, email)
            return json(res, 200, { ok: true, valid: Boolean(client), user: client?.email ?? null })
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

            let hosting
            try {
              hosting = resolveClientHostingInput(
                Boolean(body.self_hosted),
                String(body.allowed_host ?? ''),
                String(body.deploy_path ?? ''),
              )
            } catch (e) {
              return json(res, 400, { error: e instanceof Error ? e.message : String(e) })
            }

            copyDir(TEMPLATE_DIR, clientDir)
            writeAuthConfig(path.join(clientDir, 'editor'), email, passwordHash)
            customizeBio(path.join(clientDir, 'bio.json'), name)
            const licenseToken = generateLicenseToken()
            writeLicenseConfig(clientDir, slug, licenseToken, {
              selfhost: hosting.self_hosted,
              allowedHost: hosting.allowed_host ?? '',
              deployPath: hosting.deploy_path ?? '',
            })
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
              self_hosted: hosting.self_hosted,
              allowed_host: hosting.allowed_host,
              deploy_path: hosting.deploy_path,
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

            let hosting
            try {
              hosting = resolveClientHostingInput(
                Boolean(body.self_hosted),
                String(body.allowed_host ?? ''),
                String(body.deploy_path ?? ''),
              )
            } catch (e) {
              return json(res, 400, { error: e instanceof Error ? e.message : String(e) })
            }

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
            client.allowed_host = hosting.allowed_host
            client.deploy_path = hosting.deploy_path
            client.self_hosted = hosting.self_hosted
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
                self_hosted: client.self_hosted,
                allowed_host: client.allowed_host,
                deploy_path: client.deploy_path,
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
            const zip = createZipBuffer(clientDir, client)
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

      // Emula os endpoints do editor de cada cliente em dev:
      // /{slug}/editor/api/... (rotas amigáveis) e /{slug}/editor/*.php (legado)
      const EDITOR_API_ROUTES = {
        'api/auth/session': 'session.php',
        'api/auth/platform-config': 'platform-config.php',
        'api/auth/login': 'login.php',
        'api/auth/establish': 'establish-session.php',
        'api/auth/logout': 'logout.php',
        'api/bio/load': 'load.php',
        'api/bio/save': 'save.php',
        'api/bio/publish': 'publish.php',
        'api/bio/revert': 'revert.php',
        'api/bio/paths': 'paths.php',
        'api/update/status': 'update-status.php',
        'api/update/check': 'update-check.php',
        'api/update/apply': 'update-apply.php',
        'api/assets/upload': 'upload.php',
        'api/assets/list': 'list-images.php',
        'api/assets/delete': 'delete-image.php',
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length < 3 || parts[1] !== 'editor') return next()

        const slug = parts[0]
        if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()

        const editorRel = parts.slice(2).join('/')
        let file = EDITOR_API_ROUTES[editorRel] ?? null
        if (!file) {
          const last = parts[parts.length - 1]
          if (last?.endsWith('.php')) file = last
        }
        if (!file) return next()

        const clientRoot = path.join(PLATFORM_ROOT, slug)
        if (!fs.existsSync(clientRoot)) return next()

        const bioPath = path.join(clientRoot, 'bio.json')
        const draftPath = path.join(clientRoot, 'bio.draft.json')
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

          if (file === 'platform-config.php' && req.method === 'GET') {
            const license = readClientLicenseConfig(clientRoot)
            if (!license) {
              return json(res, 200, { remoteAuth: false })
            }
            const base = license.api.replace(/\/license\/check$/, '')
            return json(res, 200, {
              remoteAuth: true,
              loginUrl: `${base}/editor/login`,
              sessionUrl: `${base}/editor/session`,
              slug: license.slug,
              token: license.token,
            })
          }

          if (file === 'establish-session.php' && req.method === 'POST') {
            const body = await readBody(req)
            const email = String(body.email ?? '').toLowerCase().trim()
            const license = readClientLicenseConfig(clientRoot)
            if (
              !license ||
              !verifyEditorHandshake(
                license.token,
                email,
                license.slug,
                String(body.nonce ?? ''),
                String(body.sig ?? ''),
              )
            ) {
              return json(res, 401, { error: 'Autenticação remota inválida' })
            }
            const token = crypto.randomBytes(24).toString('hex')
            db.editor_sessions[token] = { slug, email }
            writeDb(db)
            res.setHeader(
              'Set-Cookie',
              `${editorCookieName(slug)}=${token}; Path=/${slug}/editor/; HttpOnly; SameSite=Lax; Max-Age=604800`,
            )
            return json(res, 200, { ok: true, user: email })
          }

          if (file === 'session.php' && req.method === 'GET') {
            const sess = getEditorSession(req, db, slug)
            const license = readClientLicenseConfig(clientRoot)
            if (sess && !license?.selfhost) {
              const registered = findClient(db, slug)
              const client =
                registered?.license_token
                  ? lookupClientEditor(db, slug, registered.license_token, sess.email)
                  : null
              if (!client) {
                return json(res, 200, { authenticated: false, user: null })
              }
            }
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

          if (file === 'load.php' && req.method === 'GET') {
            if (fs.existsSync(draftPath)) {
              return json(res, 200, {
                ok: true,
                config: JSON.parse(fs.readFileSync(draftPath, 'utf-8')),
                source: 'draft',
                hasDraft: true,
              })
            }
            if (fs.existsSync(bioPath)) {
              return json(res, 200, {
                ok: true,
                config: JSON.parse(fs.readFileSync(bioPath, 'utf-8')),
                source: 'published',
                hasDraft: false,
              })
            }
            return json(res, 404, { error: 'Nenhuma configuração encontrada' })
          }

          if (file === 'save.php' && req.method === 'POST') {
            const body = await readBody(req)
            fs.writeFileSync(draftPath, `${JSON.stringify(body, null, 2)}\n`, 'utf-8')
            return json(res, 200, { ok: true, saved: 'draft' })
          }

          if (file === 'publish.php' && req.method === 'POST') {
            const body = await readBody(req)
            const content = `${JSON.stringify(body, null, 2)}\n`
            fs.writeFileSync(draftPath, content, 'utf-8')
            fs.writeFileSync(bioPath, content, 'utf-8')
            return json(res, 200, { ok: true, saved: 'published' })
          }

          if (file === 'revert.php' && req.method === 'POST') {
            if (!fs.existsSync(bioPath)) {
              return json(res, 404, { error: 'Bio publicada não encontrada' })
            }
            const published = JSON.parse(fs.readFileSync(bioPath, 'utf-8'))
            fs.writeFileSync(draftPath, `${JSON.stringify(published, null, 2)}\n`, 'utf-8')
            return json(res, 200, { ok: true, config: published })
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
            if (clientBioUsesAsset(clientRoot, filename)) {
              return json(res, 409, {
                error:
                  'Imagem em uso na bio (publicada ou rascunho). Remova das seções antes de excluir.',
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

      // Em dev, o editor do cliente usa o Vite (:5180) — código sempre atualizado.
      // API PHP e platform-api.json continuam locais na pasta do cliente.
      if (EDITOR_DEV_PROXY) {
        console.log(
          `[panel dev] Editor de clientes → proxy http://127.0.0.1:${EDITOR_DEV_PORT} (/{slug}/editor/)`,
        )

        // Assets absolutos do Vite (/@vite/client, /src/...) após rewrite do HTML
        // ou quando o browser ainda pede na raiz do host do painel.
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url ?? '/', 'http://localhost')
          if (!isViteDevAssetPath(url.pathname)) return next()

          const fromEditorPath = url.pathname.match(/^\/([^/]+)\/editor(\/.*)$/)
          if (fromEditorPath) {
            const slug = fromEditorPath[1]
            if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()
            if (!fs.existsSync(path.join(PLATFORM_ROOT, slug))) return next()
            proxyToEditorDev(req, res, fromEditorPath[2] || '/')
            return
          }

          const slug = editorSlugFromReferer(req.headers.referer)
          if (!slug || RESERVED_SLUGS.has(slug)) return next()
          if (!fs.existsSync(path.join(PLATFORM_ROOT, slug))) return next()
          proxyToEditorDev(req, res, url.pathname)
        })

        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const parts = url.pathname.split('/').filter(Boolean)
          if (parts.length < 2 || parts[1] !== 'editor') return next()

          const slug = parts[0]
          if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()
          if (!fs.existsSync(path.join(PLATFORM_ROOT, slug))) return next()

          const editorRel = parts.slice(2).join('/')
          if (editorRel.startsWith('api/')) return next()
          if (EDITOR_LOCAL_FILES.has(editorRel) || editorRel.endsWith('.php')) return next()

          const targetPath = editorRel ? `/${editorRel}` : '/'
          proxyToEditorDev(req, res, targetPath)
        })
      }

      // Servir tenants criados em dev em /{slug}/ e /{slug}/editor/
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length === 0) return next()

        const slug = parts[0]
        if (RESERVED_SLUGS.has(slug) || slug === 'api' || slug === 'panel') return next()

        const clientRoot = path.join(PLATFORM_ROOT, slug)
        if (!fs.existsSync(clientRoot)) return next()

        // Rascunho nunca é público — só via API autenticada do editor
        if (parts[parts.length - 1] === 'bio.draft.json') {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Forbidden' }))
          return
        }

        const db = readDb()
        const relParts = parts.slice(1)
        const relPath = relParts.join('/')

        // Emula bio-json.php (sem PHP): devolve o bio.json do cliente
        if (relPath === 'bio-json.php') {
          const bioPath = path.join(clientRoot, 'bio.json')
          if (!fs.existsSync(bioPath)) {
            return json(res, 404, { error: 'bio.json não encontrado' })
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(fs.readFileSync(bioPath))
          return
        }

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

        // Não servir fontes PHP cruas no browser (só gate files emulados acima)
        if (relPath.endsWith('.php')) {
          return json(res, 404, { error: 'Não disponível em desenvolvimento local' })
        }

        let candidate = parts.length === 1
          ? path.join(clientRoot, 'index.html')
          : path.join(clientRoot, ...parts.slice(1))

        // /{slug}/editor/preview → preview.html (Apache faz isso em produção)
        if (
          parts[1] === 'editor' &&
          (parts[parts.length - 1] === 'preview' || relPath === 'editor/preview/')
        ) {
          candidate = path.join(clientRoot, 'editor', 'preview.html')
        }

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
