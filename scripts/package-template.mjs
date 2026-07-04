import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE = path.join(ROOT, 'platform-template', '_template')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

const env = { ...process.env, TEMPLATE_BUILD: '1' }

console.log('')
console.log('→ Build da bio (template relativo)…')
execSync('npm run build', { cwd: ROOT, env, stdio: 'inherit' })

console.log('→ Build do editor (template relativo)…')
execSync('npm run build:hostgator-template', { cwd: path.join(ROOT, 'admin'), env, stdio: 'inherit' })

const siteDist = path.join(ROOT, 'dist')
const editorDist = path.join(ROOT, 'admin', 'dist')

if (!fs.existsSync(siteDist) || !fs.existsSync(editorDist)) {
  console.error('Builds não encontrados.')
  process.exit(1)
}

console.log('→ Montando platform-template/_template/…')
fs.rmSync(TEMPLATE, { recursive: true, force: true })
fs.mkdirSync(TEMPLATE, { recursive: true })

copyDir(siteDist, TEMPLATE)
copyDir(editorDist, path.join(TEMPLATE, 'editor'))

fs.writeFileSync(
  path.join(TEMPLATE, '.htaccess'),
  `# Bloqueia acesso direto ao modelo (só cópias de clientes são públicas)
<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
`,
)

console.log('')
console.log('Template pronto em: platform-template/_template/')
console.log('')
