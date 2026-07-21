#!/usr/bin/env node
/**
 * Garante que platform-template/_template (e clientes locais) reflitam o código-fonte.
 * Usado pelo make dev-all para não servir builds velhos em /{slug}/ e /{slug}/editor/.
 *
 * Env:
 *   SKIP_DEV_BUILD=1   — não rebuilda
 *   FORCE_DEV_BUILD=1  — rebuilda sempre
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE_DIR = path.join(ROOT, 'platform-template', '_template')
const TEMPLATE_INDEX = path.join(TEMPLATE_DIR, 'index.html')
const STAMP = path.join(TEMPLATE_DIR, '.dev-build-stamp')
const PLATFORM_ROOT = path.join(ROOT, 'panel', 'data', 'platform')

const SOURCE_PATHS = [
  'bio/src',
  'bio/public',
  'bio/index.html',
  'bio/vite.config.ts',
  'bio/package.json',
  'editor/src',
  'editor/index.html',
  'editor/preview.html',
  'editor/demo.html',
  'editor/vite.config.ts',
  'editor/package.json',
  'editor/scripts',
  'scripts/package-template.mjs',
  'scripts/ensure-dev-builds.mjs',
]

function maxMtime(target, acc = 0) {
  if (!fs.existsSync(target)) return acc
  const stat = fs.statSync(target)
  let newest = Math.max(acc, stat.mtimeMs)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) {
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue
      newest = maxMtime(path.join(target, name), newest)
    }
  }
  return newest
}

function templateBuiltAt() {
  if (fs.existsSync(STAMP)) {
    const raw = fs.readFileSync(STAMP, 'utf8').trim()
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  if (!fs.existsSync(TEMPLATE_INDEX)) return 0
  return maxMtime(TEMPLATE_DIR)
}

function sourcesNewest() {
  let newest = 0
  for (const rel of SOURCE_PATHS) {
    newest = maxMtime(path.join(ROOT, rel), newest)
  }
  return newest
}

function run(cmd) {
  console.log(`→ ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

function main() {
  if (process.env.SKIP_DEV_BUILD === '1') {
    console.log('→ SKIP_DEV_BUILD=1 — mantendo template atual')
    return
  }

  const force = process.env.FORCE_DEV_BUILD === '1'
  const builtAt = templateBuiltAt()
  const sourceAt = sourcesNewest()
  const missing = !fs.existsSync(TEMPLATE_INDEX)

  if (!force && !missing && sourceAt <= builtAt) {
    console.log('→ Template de cliente já está atualizado (fontes não mudaram)')
    // Ainda assim sincroniza se o template do painel/cliente estiver atrás
    ensurePanelTemplateCopy()
    return
  }

  if (missing) console.log('→ Template ausente — gerando…')
  else if (force) console.log('→ FORCE_DEV_BUILD=1 — rebuildando template…')
  else console.log('→ Fontes mais novas que o template — rebuildando…')

  run('npm run build:template')
  fs.writeFileSync(STAMP, String(Date.now()))

  if (fs.existsSync(PLATFORM_ROOT)) {
    run('npm run sync:clients -- --platform-root panel/data/platform')
  } else {
    console.log('→ Nenhum cliente em panel/data/platform (sync pulado)')
  }

  ensurePanelTemplateCopy()
}

/** Copia platform-template → panel/data/platform-template se estiver desatualizado. */
function ensurePanelTemplateCopy() {
  const rootTpl = TEMPLATE_DIR
  const panelTpl = path.join(ROOT, 'panel', 'data', 'platform-template', '_template')
  if (!fs.existsSync(path.join(rootTpl, 'index.html'))) return

  const rootIndex = path.join(rootTpl, 'index.html')
  const localIndex = path.join(panelTpl, 'index.html')
  const needsCopy =
    !fs.existsSync(localIndex) ||
    fs.statSync(rootIndex).mtimeMs > fs.statSync(localIndex).mtimeMs

  if (!needsCopy) return

  fs.rmSync(path.dirname(panelTpl), { recursive: true, force: true })
  fs.mkdirSync(path.dirname(panelTpl), { recursive: true })
  fs.cpSync(rootTpl, panelTpl, { recursive: true })
  console.log('→ Template do painel atualizado (panel/data/platform-template)')
}

main()
