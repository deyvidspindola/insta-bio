import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PANEL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(PANEL_ROOT, 'dist')
const PHP = path.join(PANEL_ROOT, 'php')
const VENDOR = path.join(PANEL_ROOT, 'vendor')

if (!fs.existsSync(DIST)) {
  console.error('Rode o build antes (npm run build:hostgator --prefix panel).')
  process.exit(1)
}

const skip = new Set([])

for (const entry of fs.readdirSync(PHP)) {
  if (skip.has(entry)) continue
  const src = path.join(PHP, entry)
  const dest = path.join(DIST, entry)
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true })
  } else {
    fs.copyFileSync(src, dest)
  }
}

if (fs.existsSync(VENDOR) && fs.statSync(VENDOR).isDirectory()) {
  fs.cpSync(VENDOR, path.join(DIST, 'vendor'), { recursive: true })
}

const hasConfig = fs.existsSync(path.join(DIST, 'db.config.php'))

const sitesDir = path.join(DIST, 'sites')
fs.mkdirSync(sitesDir, { recursive: true })
fs.writeFileSync(path.join(sitesDir, '.gitkeep'), '')

console.log('Painel pronto em: panel/dist/')
if (hasConfig) {
  console.log('db.config.php incluído no pacote de deploy.')
} else {
  console.log('')
  console.log('ATENÇÃO: copie panel/php/db.config.example.php → panel/php/db.config.php')
  console.log('Execute panel/deploy-seed.sql no MySQL e insira seu admin.')
}

if (fs.existsSync(path.join(DIST, 'vendor', 'autoload.php'))) {
  console.log('vendor/ incluído no pacote (Sentry ativo se SENTRY_DSN estiver definido).')
}
