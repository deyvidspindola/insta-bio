import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'platform-release')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

console.log('')
console.log('insta-bio — pacote da plataforma (landing + panel + template)')
console.log('')

execSync('node scripts/package-template.mjs', { cwd: ROOT, stdio: 'inherit' })

console.log('→ Build da landing…')
execSync('npm run build', { cwd: path.join(ROOT, 'site'), stdio: 'inherit' })

console.log('→ Build do painel…')
execSync('npm run build:hostgator', { cwd: path.join(ROOT, 'panel'), stdio: 'inherit' })

const siteDist = path.join(ROOT, 'site', 'dist')
const panelDist = path.join(ROOT, 'panel', 'dist')
const templateSrc = path.join(ROOT, 'platform-template', '_template')

if (!fs.existsSync(siteDist) || !fs.existsSync(panelDist) || !fs.existsSync(templateSrc)) {
  console.error('Faltam artefatos de build.')
  process.exit(1)
}

console.log('→ Montando platform-release/…')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

copyDir(siteDist, OUT)
copyDir(panelDist, path.join(OUT, 'panel'))
copyDir(templateSrc, path.join(OUT, '_template'))

fs.writeFileSync(
  path.join(OUT, '_template', '.htaccess'),
  `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
`,
)

console.log('')
console.log('Pronto em: platform-release/')
console.log('  /              → landing')
console.log('  /panel/        → super-admin')
console.log('  /_template/    → modelo (bloqueado via .htaccess)')
console.log('  /{slug}/       → criado pelo painel')
console.log('')
