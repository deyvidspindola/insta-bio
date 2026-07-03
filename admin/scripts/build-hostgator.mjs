import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ADMIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ADMIN_ROOT, 'dist')
const PHP = path.join(ADMIN_ROOT, 'php')

if (!fs.existsSync(DIST)) {
  console.error('Rode o build antes (npm run build --prefix admin).')
  process.exit(1)
}

for (const entry of fs.readdirSync(PHP)) {
  fs.copyFileSync(path.join(PHP, entry), path.join(DIST, entry))
}

const hasConfig = fs.existsSync(path.join(DIST, 'auth.config.php'))

console.log('Pasta do editor pronta em: admin/dist/')
console.log('Suba TODO o conteúdo de admin/dist/ para uma subpasta do site, ex.: /editor/')
console.log('')
if (!hasConfig) {
  console.log('ATENÇÃO: falta o auth.config.php.')
  console.log('  1. Copie admin/php/auth.config.example.php para admin/php/auth.config.php')
  console.log('  2. Gere a senha: npm run hash-password --prefix admin -- "sua-senha"')
  console.log('  3. Cole o hash no auth.config.php e rode este comando de novo')
} else {
  console.log('auth.config.php incluído. Confira usuário e hash antes de subir.')
}
