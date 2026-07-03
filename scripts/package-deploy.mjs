import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { editorBaseFrom, normalizeBasePath } from './lib/base-path.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RELEASE = path.join(ROOT, 'release')
const CONFIG_FILE = path.join(ROOT, 'deploy.config.json')

function readBasePath() {
  if (process.env.BASE_PATH) {
    return normalizeBasePath(process.env.BASE_PATH)
  }

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
      if (config.basePath) return normalizeBasePath(config.basePath)
    } catch {
      console.warn('deploy.config.json inválido — usando raiz "/"')
    }
  }

  return '/'
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

const publicBase = readBasePath()
const editorBase = editorBaseFrom(publicBase)

console.log('')
console.log('insta-bio — pacote de deploy')
console.log(`  Base pública:  ${publicBase}`)
console.log(`  Editor:        ${editorBase}`)
console.log('')

const env = { ...process.env, BASE_PATH: publicBase }

console.log('→ Build do site da bio…')
execSync('npm run build', { cwd: ROOT, env, stdio: 'inherit' })

console.log('→ Build do editor + PHP…')
execSync('npm run build:hostgator', { cwd: path.join(ROOT, 'admin'), env, stdio: 'inherit' })

const siteDist = path.join(ROOT, 'dist')
const adminDist = path.join(ROOT, 'admin', 'dist')
const editorOut = path.join(RELEASE, 'editor')

if (!fs.existsSync(siteDist)) {
  console.error('dist/ não encontrado após o build do site.')
  process.exit(1)
}
if (!fs.existsSync(adminDist)) {
  console.error('admin/dist/ não encontrado após o build do editor.')
  process.exit(1)
}

console.log('→ Montando pasta release/…')
fs.rmSync(RELEASE, { recursive: true, force: true })
fs.mkdirSync(RELEASE, { recursive: true })

copyDir(siteDist, RELEASE)
copyDir(adminDist, editorOut)

const exampleUrl =
  publicBase === '/'
    ? 'https://seudominio.com/'
    : `https://seudominio.com${publicBase.replace(/\/$/, '')}/`

console.log('')
console.log('Pronto! Suba TODO o conteúdo de release/ para o servidor:')
console.log(`  ${RELEASE}/`)
console.log('')
console.log('URLs esperadas:')
console.log(`  Bio:    ${exampleUrl}`)
console.log(`  Editor: ${exampleUrl}editor/`)
console.log('')
console.log('Dica: copie deploy.config.example.json → deploy.config.json e ajuste basePath.')
console.log('      Ou use: make package BASE_PATH=/insta-bio')
console.log('')
