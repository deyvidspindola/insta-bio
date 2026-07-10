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
  fs.copyFileSync(path.join(PHP, entry), path.join(DIST, entry))
}

console.log('Template do editor pronto em: editor/dist/')
console.log('auth.config.php NÃO incluído — gerado no provisionamento de cada cliente.')
