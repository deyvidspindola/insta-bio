import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EDITOR_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(EDITOR_ROOT, 'dist')
const PHP = path.join(EDITOR_ROOT, 'php')

if (!fs.existsSync(DIST)) {
  console.error('Rode o build antes (npm run build --prefix editor).')
  process.exit(1)
}

for (const entry of fs.readdirSync(PHP)) {
  if (skip.has(entry) || entry === 'bio-json.php') continue
  fs.copyFileSync(path.join(PHP, entry), path.join(DIST, entry))
}

const hasConfig = fs.existsSync(path.join(DIST, 'auth.config.php'))

console.log('Pasta do editor pronta em: editor/dist/')
console.log('Suba TODO o conteúdo de editor/dist/ para uma subpasta do site, ex.: /editor/')
console.log('')
if (!hasConfig) {
  console.log('ATENÇÃO: falta o auth.config.php (caminhos do editor).')
  console.log('  Copie editor/php/auth.config.example.php para editor/php/auth.config.php')
  console.log('  Em clientes da plataforma, isso é gerado automaticamente no provisionamento.')
} else {
  console.log('auth.config.php incluído (somente caminhos — login via API do painel).')
}
