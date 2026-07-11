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

function mergeDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) mergeDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

console.log('')
console.log('links na bio — pacote da plataforma (landing + panel + template + demo)')
console.log('')

execSync('node scripts/package-template.mjs', { cwd: ROOT, stdio: 'inherit' })

console.log('→ Build da landing…')
execSync('npm run build', { cwd: path.join(ROOT, 'site'), stdio: 'inherit' })

console.log('→ Build do editor demo…')
execSync('npm run build', { cwd: path.join(ROOT, 'editor'), stdio: 'inherit' })

if (fs.existsSync(path.join(ROOT, 'panel', 'composer.json'))) {
  console.log('→ Composer do painel (Sentry)…')
  execSync('composer install --no-dev --optimize-autoloader', {
    cwd: path.join(ROOT, 'panel'),
    stdio: 'inherit',
  })
}

console.log('→ Build do painel…')
execSync('npm run build:hostgator', { cwd: path.join(ROOT, 'panel'), stdio: 'inherit' })

const siteDist = path.join(ROOT, 'site', 'dist')
const panelDist = path.join(ROOT, 'panel', 'dist')
const editorDist = path.join(ROOT, 'editor', 'dist')
const templateSrc = path.join(ROOT, 'platform-template', '_template')
const publicAssets = path.join(ROOT, 'bio', 'public', 'assets')

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

const templateAssets = path.join(OUT, '_template', 'assets')
const bundles = fs.existsSync(templateAssets)
  ? fs.readdirSync(templateAssets).filter((f) => /\.(js|css|mjs)$/i.test(f))
  : []
if (bundles.length === 0) {
  console.error('ERRO: _template/assets sem bundles JS/CSS. Abortando release.')
  process.exit(1)
}
console.log(`  _template/assets: ${bundles.join(', ')}`)

mergeDir(publicAssets, path.join(OUT, 'assets'))

if (fs.existsSync(editorDist)) {
  const editorOut = path.join(OUT, 'editor')
  const editorAssetsOut = path.join(editorOut, 'assets')
  const editorAssets = path.join(editorDist, 'assets')

  if (fs.existsSync(path.join(editorDist, 'demo.html'))) {
    fs.copyFileSync(path.join(editorDist, 'demo.html'), path.join(OUT, 'demo.html'))
  }
  if (fs.existsSync(path.join(editorDist, 'preview.html'))) {
    fs.copyFileSync(path.join(editorDist, 'preview.html'), path.join(OUT, 'preview.html'))
    fs.mkdirSync(editorOut, { recursive: true })
    fs.copyFileSync(path.join(editorDist, 'preview.html'), path.join(editorOut, 'preview.html'))
  }

  // demo.html e preview.html referenciam /editor/assets/* (base do build do editor)
  if (fs.existsSync(editorAssets)) {
    copyDir(editorAssets, editorAssetsOut)
    mergeDir(editorAssets, path.join(OUT, 'assets'))
  }

  for (const name of ['icons.svg', 'favicon.svg']) {
    const src = path.join(editorDist, name)
    if (fs.existsSync(src)) {
      fs.mkdirSync(editorOut, { recursive: true })
      fs.copyFileSync(src, path.join(editorOut, name))
    }
  }

  const demoBio = path.join(ROOT, 'editor', 'public', 'demo-bio.json')
  if (fs.existsSync(demoBio)) {
    fs.copyFileSync(demoBio, path.join(OUT, 'demo-bio.json'))
    fs.mkdirSync(editorOut, { recursive: true })
    fs.copyFileSync(demoBio, path.join(editorOut, 'demo-bio.json'))
  }

  const demoBundles = fs.existsSync(editorAssetsOut)
    ? fs.readdirSync(editorAssetsOut).filter((f) => /^demo-.*\.js$/.test(f))
    : []
  if (demoBundles.length === 0) {
    console.error('ERRO: editor/assets sem demo-*.js. A página /demo ficará em branco.')
    process.exit(1)
  }
  console.log(`  /demo → editor/assets/${demoBundles[0]}`)

  if (!fs.existsSync(path.join(OUT, 'preview.html'))) {
    console.error('ERRO: preview.html ausente na raiz do release.')
    process.exit(1)
  }
  if (!fs.existsSync(path.join(editorOut, 'preview.html'))) {
    console.error('ERRO: editor/preview.html ausente — /editor/preview retorna 404.')
    process.exit(1)
  }
}

fs.copyFileSync(path.join(ROOT, 'panel', 'deploy-seed.sql'), path.join(OUT, 'DEPLOY-seed.sql'))

fs.copyFileSync(path.join(ROOT, 'deploy', 'apache', 'root.htaccess'), path.join(OUT, '.htaccess'))
fs.copyFileSync(path.join(ROOT, 'deploy', 'apache', 'root.htaccess'), path.join(OUT, 'htaccess-raiz.txt'))
fs.writeFileSync(
  path.join(OUT, 'LEIA-ME-htaccess.txt'),
  `Se o arquivo .htaccess não subiu pelo FTP (arquivos ocultos), renomeie htaccess-raiz.txt para .htaccess na raiz do public_html.
O painel usa panel/.htaccess — se faltar, copie de deploy/apache/panel.htaccess do repositório.
`,
)

fs.writeFileSync(
  path.join(OUT, '_template', '.htaccess'),
  `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
`,
)

// ZIP de update remoto (fonte única: plataforma + self-hosted).
console.log('→ Pacote de atualização remota (dist/updates/ + panel/data/updates/)…')
execSync('npm run build:update-package', { cwd: ROOT, stdio: 'inherit' })

const updatesSrc = path.join(ROOT, 'panel', 'data', 'updates')
const updatesDest = path.join(OUT, 'panel', 'data', 'updates')
if (fs.existsSync(updatesSrc)) {
  fs.mkdirSync(updatesDest, { recursive: true })
  for (const name of fs.readdirSync(updatesSrc)) {
    const from = path.join(updatesSrc, name)
    if (!fs.statSync(from).isFile()) continue
    fs.copyFileSync(from, path.join(updatesDest, name))
  }
  console.log('  → panel/data/updates/ incluído em platform-release/')
} else {
  console.warn('  ⚠ panel/data/updates/ ausente após build:update-package')
}

console.log('')
console.log('Pronto em: platform-release/')
console.log('  /              → landing comercial')
console.log('  /demo          → editor de demonstração')
console.log('  /panel/        → super-admin')
console.log('  /panel/data/updates/ → ZIP + updates.json (self-hosted)')
console.log('  /_template/    → modelo (bloqueado via .htaccess)')
console.log('  /{slug}/       → criado pelo painel')
console.log('')
console.log('Antes de usar o painel: acesse /panel/install uma vez (ou execute DEPLOY-seed.sql no phpMyAdmin).')
console.log('No FTP: preserve panel/php/db.config.php e panel/sites/ (ou data) existentes.')
console.log('')

const zipPath = path.join(ROOT, 'platform-release.zip')
if (fs.existsSync(zipPath)) fs.rmSync(zipPath)

function zipRelease() {
  try {
    execSync(`zip -rq "${zipPath}" .`, { cwd: OUT, stdio: 'pipe' })
    return
  } catch {
    // zip ausente — fallback via Python (comum em WSL)
    execSync(
      `python3 -c "import zipfile, os; root='${OUT}'; z=zipfile.ZipFile('${zipPath}','w',zipfile.ZIP_DEFLATED); [z.write(os.path.join(dp,f), os.path.relpath(os.path.join(dp,f), root)) for dp,_,fs in os.walk(root) for f in fs]; z.close()"`,
      { stdio: 'inherit' },
    )
  }
}

zipRelease()
console.log(`Pacote zip: platform-release.zip`)
console.log('')
