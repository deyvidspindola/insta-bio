import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT_HTACCESS = path.join(ROOT, 'deploy', 'apache', 'client.htaccess')
const TEMPLATE = path.join(ROOT, 'platform-template', '_template')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])

function parseArgs() {
  const args = process.argv.slice(2)
  let platformRoot = path.join(ROOT, 'panel', 'data', 'platform')
  let rebuild = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform-root' && args[i + 1]) {
      platformRoot = path.resolve(args[++i])
    }
    if (args[i] === '--rebuild') rebuild = true
  }

  return { platformRoot, rebuild }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyDirExcept(src, dest, skipNames = new Set()) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirExcept(from, to, skipNames)
    else copyFile(from, to)
  }
}

function isBundleFile(name) {
  return /^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name) || /^main-[A-Za-z0-9_-]+\.(js|css)$/.test(name)
}

function removeBundleFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (isBundleFile(name)) fs.unlinkSync(path.join(dir, name))
  }
}

function syncClientBio(clientDir, templateDir) {
  for (const name of ['index.html', 'suspended.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg']) {
    const src = path.join(templateDir, name)
    if (fs.existsSync(src)) copyFile(src, path.join(clientDir, name))
  }

  const tplAssets = path.join(templateDir, 'assets')
  const dstAssets = path.join(clientDir, 'assets')
  fs.mkdirSync(dstAssets, { recursive: true })

  removeBundleFiles(dstAssets)

  for (const name of fs.readdirSync(tplAssets)) {
    if (isBundleFile(name)) {
      copyFile(path.join(tplAssets, name), path.join(dstAssets, name))
    }
  }
}

function syncClientEditor(clientDir, templateDir) {
  const tplEditor = path.join(templateDir, 'editor')
  const dstEditor = path.join(clientDir, 'editor')
  if (!fs.existsSync(tplEditor)) return

  const assetsDir = path.join(dstEditor, 'assets')
  removeBundleFiles(assetsDir)

  copyDirExcept(tplEditor, dstEditor, new Set(['auth.config.php']))

  if (!fs.existsSync(path.join(dstEditor, 'preview.html'))) {
    console.warn(`  ⚠ preview.html ausente em ${path.basename(clientDir)}/editor/`)
  }

  const authPath = path.join(dstEditor, 'auth.config.php')
  if (!fs.existsSync(authPath)) {
    console.warn(`  ⚠ auth.config.php ausente em ${path.basename(clientDir)}/editor/`)
  }
}

function writeClientHtaccess(clientDir) {
  fs.writeFileSync(path.join(clientDir, '.htaccess'), fs.readFileSync(CLIENT_HTACCESS, 'utf8'))
}

function syncClient(clientDir, templateDir) {
  syncClientBio(clientDir, templateDir)
  syncClientEditor(clientDir, templateDir)
  writeClientHtaccess(clientDir)
}

function listClientSlugs(platformRoot) {
  if (!fs.existsSync(platformRoot)) return []
  return fs
    .readdirSync(platformRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== '_template')
    .map((e) => e.name)
}

const { platformRoot, rebuild } = parseArgs()

if (rebuild || !fs.existsSync(path.join(TEMPLATE, 'index.html'))) {
  console.log('→ Build do template…')
  execSync('npm run build:template', { cwd: ROOT, stdio: 'inherit' })
}

if (!fs.existsSync(TEMPLATE)) {
  console.error('Template não encontrado. Rode: npm run build:template')
  process.exit(1)
}

const slugs = listClientSlugs(platformRoot)
if (slugs.length === 0) {
  console.log(`Nenhum cliente em ${platformRoot}`)
  process.exit(0)
}

console.log('')
console.log(`Sincronizando template em ${slugs.length} cliente(s)…`)
console.log(`  origem: ${TEMPLATE}`)
console.log(`  destino: ${platformRoot}`)
console.log('  preservado: bio.json, bio.draft.json, assets de imagem, auth.config.php, .suspended')
console.log('')

for (const slug of slugs) {
  const clientDir = path.join(platformRoot, slug)
  syncClient(clientDir, TEMPLATE)
  console.log(`  ✓ ${slug}`)
}

console.log('')
console.log('Concluído.')
console.log('')
