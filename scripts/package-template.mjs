import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE = path.join(ROOT, 'platform-template', '_template')
const MINIMAL_BIO = path.join(ROOT, 'bio', 'public', 'bio.template.json')

const BUILD_ASSET_EXT = new Set(['.js', '.css', '.mjs'])

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

/** Mantém só bundles do Vite (.js / .css). Remove imagens e lixo de public/assets. */
function keepOnlyBuildBundles(assetsDir, label) {
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`${label}: pasta assets/ não existe em ${assetsDir}`)
  }

  const kept = []
  for (const name of fs.readdirSync(assetsDir)) {
    const full = path.join(assetsDir, name)
    const ext = path.extname(name).toLowerCase()
    if (BUILD_ASSET_EXT.has(ext)) {
      kept.push(name)
      continue
    }
    fs.rmSync(full, { recursive: true, force: true })
  }

  if (kept.length === 0) {
    throw new Error(
      `${label}: nenhum bundle .js/.css em assets/. O build do Vite falhou ou os arquivos foram apagados.`,
    )
  }

  return kept
}

function assertIndexReferencesBundles(templateDir) {
  const indexPath = path.join(templateDir, 'index.html')
  const html = fs.readFileSync(indexPath, 'utf8')
  const assetsDir = path.join(templateDir, 'assets')
  const bundles = fs.readdirSync(assetsDir)

  for (const bundle of bundles) {
    if (!html.includes(bundle)) continue
    return
  }

  throw new Error(
    '_template/index.html não referencia nenhum bundle em assets/. Rebuild inconsistente.',
  )
}

/** Deixa o pacote do cliente só com o mínimo (sem imagens nem conteúdo de demo). */
function sanitizeClientTemplate(templateDir) {
  if (!fs.existsSync(MINIMAL_BIO)) {
    throw new Error('bio/public/bio.template.json não encontrado')
  }

  fs.copyFileSync(MINIMAL_BIO, path.join(templateDir, 'bio.json'))

  for (const name of ['bio.default.json', 'bio.template.json', 'demo-bio.json', 'logo-instabio.svg']) {
    removeIfExists(path.join(templateDir, name))
  }

  const bioBundles = keepOnlyBuildBundles(path.join(templateDir, 'assets'), 'bio')
  assertIndexReferencesBundles(templateDir)

  const editorDir = path.join(templateDir, 'editor')
  if (fs.existsSync(editorDir)) {
    // preview.html é obrigatório para o iframe "Preview ao vivo" no editor
    for (const name of ['demo-bio.json', 'logo-instabio.svg', 'demo.html']) {
      removeIfExists(path.join(editorDir, name))
    }
    const editorBundles = keepOnlyBuildBundles(path.join(editorDir, 'assets'), 'editor')
    if (!fs.existsSync(path.join(editorDir, 'preview.html'))) {
      throw new Error('editor/preview.html ausente no template — o preview do editor não funcionará')
    }
    const hasPreviewBundle = editorBundles.some((f) => f.startsWith('preview-') && f.endsWith('.js'))
    if (!hasPreviewBundle) {
      throw new Error('editor/assets sem preview-*.js — o preview do editor não funcionará')
    }
  }

  fs.writeFileSync(
    path.join(templateDir, 'LEIA-ME.txt'),
    `Modelo de cliente (_template)
==========================

NÃO apague a pasta assets/ nem preview.html — o preview ao vivo do editor depende deles.

Bio: ${bioBundles.join(', ')}

Ao subir por FTP, envie _template/ inteiro (incluindo assets/*.js e assets/*.css).
O painel copia esta pasta ao criar um novo cliente.
`,
  )
}

const env = { ...process.env, TEMPLATE_BUILD: '1' }

console.log('')
console.log('→ Build da bio (template relativo)…')
execSync('npm run build', { cwd: path.join(ROOT, 'bio'), env, stdio: 'inherit' })

console.log('→ Build do editor (template relativo)…')
execSync('npm run build:hostgator-template', { cwd: path.join(ROOT, 'editor'), env, stdio: 'inherit' })

const siteDist = path.join(ROOT, 'dist')
const editorDist = path.join(ROOT, 'editor', 'dist')

if (!fs.existsSync(siteDist) || !fs.existsSync(editorDist)) {
  console.error('Builds não encontrados.')
  process.exit(1)
}

console.log('→ Montando platform-template/_template/…')
fs.rmSync(TEMPLATE, { recursive: true, force: true })
fs.mkdirSync(TEMPLATE, { recursive: true })

copyDir(siteDist, TEMPLATE)
copyDir(editorDist, path.join(TEMPLATE, 'editor'))

console.log('→ Limpando template (bio mínimo, preservando bundles)…')
sanitizeClientTemplate(TEMPLATE)

fs.writeFileSync(
  path.join(TEMPLATE, '.htaccess'),
  `# Bloqueia acesso direto ao modelo (só cópias de clientes são públicas)
<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
`,
)

const bioAssets = fs.readdirSync(path.join(TEMPLATE, 'assets')).join(', ')
const editorAssets = fs.existsSync(path.join(TEMPLATE, 'editor', 'assets'))
  ? fs.readdirSync(path.join(TEMPLATE, 'editor', 'assets')).length
  : 0

console.log('')
console.log('Template pronto em: platform-template/_template/')
console.log(`  bio assets: ${bioAssets}`)
console.log(`  editor assets: ${editorAssets} arquivo(s)`)
console.log('')

fs.writeFileSync(path.join(TEMPLATE, '.dev-build-stamp'), String(Date.now()))
