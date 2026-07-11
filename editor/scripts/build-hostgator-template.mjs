import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EDITOR_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(EDITOR_ROOT, 'dist')
const PHP = path.join(EDITOR_ROOT, 'php')

if (!fs.existsSync(DIST)) {
  console.error('Rode o build antes (npm run build:hostgator-template --prefix editor).')
  process.exit(1)
}

const skip = new Set(['auth.config.php'])

for (const entry of fs.readdirSync(PHP)) {
  if (skip.has(entry) || entry === 'bio-json.php') continue
  const from = path.join(PHP, entry)
  if (!fs.statSync(from).isFile()) continue
  fs.copyFileSync(from, path.join(DIST, entry))
}

// Pastas protegidas para apply remoto (Fase D)
for (const dir of ['.update-tmp', '.update-backup']) {
  const dest = path.join(DIST, dir)
  fs.mkdirSync(dest, { recursive: true })
  fs.writeFileSync(path.join(dest, '.htaccess'), 'Require all denied\n')
}

console.log('Template do editor pronto em: editor/dist/')
console.log('auth.config.php NÃO incluído — gerado no provisionamento de cada cliente.')
