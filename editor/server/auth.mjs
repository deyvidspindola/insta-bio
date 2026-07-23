import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EDITOR_ROOT = path.resolve(__dirname, '..')
const AUTH_FILE = path.join(EDITOR_ROOT, 'auth.json')
const SECRET_FILE = path.join(EDITOR_ROOT, '.auth-secret')

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function ensureSecret() {
  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'))
  }
  return fs.readFileSync(SECRET_FILE, 'utf-8').trim()
}

export function loadCredentials() {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(
      `Arquivo auth.json não encontrado. Copie auth.example.json para auth.json e defina usuário/senha.`,
    )
  }
  return readJson(AUTH_FILE)
}

export async function verifyLogin(username, password) {
  const creds = loadCredentials()
  const email = String(username ?? '').trim().toLowerCase()
  const expected = String(creds.username ?? '').trim().toLowerCase()
  if (!email || email !== expected) return false

  if (creds.passwordHash) {
    return bcrypt.compare(password, creds.passwordHash)
  }

  if (creds.password) {
    return password === creds.password
  }

  return false
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export function createSessionToken(username) {
  const secret = ensureSecret()
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString('base64url')
  const signature = sign(payload, secret)
  return `${payload}.${signature}`
}

export function verifySessionToken(token) {
  if (!token) return null

  try {
    const secret = ensureSecret()
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null

    const expected = sign(payload, secret)
    if (signature !== expected) return null

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    if (!data.expiresAt || Date.now() > data.expiresAt) return null

    return { username: data.username }
  } catch {
    return null
  }
}

export function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        if (index === -1) return [part, '']
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      }),
  )
}

export function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}${secure}`
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie)
  return verifySessionToken(cookies.admin_session)
}

export async function handleAuthRequest(req, res) {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/api/auth/session' && req.method === 'GET') {
    const session = getSessionFromRequest(req)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ authenticated: Boolean(session), user: session?.username ?? null }))
    return true
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body)
        const valid = await verifyLogin(username, password)
        if (!valid) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Usuário ou senha inválidos' }))
          return
        }

        const token = createSessionToken(username)
        res.setHeader('Set-Cookie', sessionCookie(token))
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, user: username }))
      } catch {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Requisição inválida' }))
      }
    })
    return true
  }

  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', clearSessionCookie())
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
    return true
  }

  return false
}

export function requireSession(req, res) {
  const session = getSessionFromRequest(req)
  if (!session) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Não autenticado' }))
    return null
  }
  return session
}
