#!/usr/bin/env node
/**
 * Gera dist/updates/insta-bio-{version}.zip + manifest.json interno
 * + atualiza dist/updates/updates.json (manifesto com histórico por versão).
 *
 * Por padrão:
 *   - incrementa VERSION (patch)
 *   - gera changelog automático em frases para o usuário (sem lista de arquivos)
 *
 * Uso:
 *   npm run build:update-package
 *   npm run build:update-package -- --changelog="Correção manual"
 *   npm run build:update-package -- --bump=minor
 *   npm run build:update-package -- --no-bump
 *   npm run build:update-package -- --set-version=1.2.0
 *   npm run build:update-package -- --skip-build   (reusa dist/ — só debug local)
 *
 * NÃO rodar em make dev-all.
 */
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZipArchive } from 'archiver'
import {
  autoChangelog,
  bumpSemver,
  changelogStampPath,
  parseSemver,
  readLatestPublished,
  snapshotProductFiles,
  writeChangelogStamp,
  writeVersion,
} from './lib/version-release.mjs'
import { isViteBundleFile } from './lib/vite-bundles.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GATE_DIR = path.join(ROOT, 'panel', 'php', 'client-gate')
const BIO_DIST = path.join(ROOT, 'dist')
const EDITOR_DIST = path.join(ROOT, 'editor', 'dist')
const UPDATES_DIR = path.join(ROOT, 'dist', 'updates')
const UPDATES_JSON = path.join(UPDATES_DIR, 'updates.json')
const PANEL_UPDATES_JSON = path.join(ROOT, 'panel', 'data', 'updates', 'updates.json')

const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const noBump = args.includes('--no-bump')
const bumpArg = args.find((a) => a.startsWith('--bump='))
const bumpLevel = bumpArg ? bumpArg.slice('--bump='.length) : 'patch'
const setVersionArg = args.find((a) => a.startsWith('--set-version='))
const setVersion = setVersionArg ? setVersionArg.slice('--set-version='.length).trim() : ''
const changelogArg = args.find((a) => a.startsWith('--changelog='))
const changelogOverride = changelogArg ? changelogArg.slice('--changelog='.length) : ''

/** @type {string} */
let changelog = changelogOverride
/** @type {Record<string, string> | null} */
let changelogSnapshot = null

// Espelha a lista "preserve" do sync-clients-template.mjs (ver PADROES-ATUALIZACOES-REMOTAS.md § 2)
const SENSITIVE_FILES = [
  'auth.config.php',
  'bio.json',
  'bio.draft.json',
  'bio-path.json',
  'platform-api.json',
  'update-state.json',
  'update.log',
  'update.log.1',
]

const PRESERVE_LIST = [
  'bio.json',
  'bio.draft.json',
  'bio-path.json',
  'license.config.php',
  '.license-cache.json',
  'assets/**',
  'editor/auth.config.php',
  'editor/platform-api.json',
  'editor/update-state.json',
  'editor/update.log',
]

// Arquivos de gate genéricos (iguais para todos os clientes) que ficam na RAIZ do
// site. Vivem em panel/php/client-gate/ e precisam viajar no ZIP de update — senão
// clientes self-hosted (que só atualizam pelo editor) nunca recebem correções no
// gate (ex.: injeção de analytics). license.config.php NÃO entra: é específico do
// cliente e o apply o preserva. Mapa: [origem em client-gate/, destino em site/].
const GATE_SITE_FILES = [
  ['index-gate.php', 'index.php'],
  ['client-license.php', 'client-license.php'],
  ['bio-share-meta.php', 'bio-share-meta.php'],
  ['bio-json.php', 'bio-json.php'],
  ['verificar-ambiente.php', 'verificar-ambiente.php'],
  ['analytics-track.php', 'analytics-track.php'],
]

const MAX_ZIP_SIZE_WARN = 50 * 1024 * 1024 // mesmo limite planejado para o apply (Fase D)

function log(msg) {
  console.log(`[build:update-package] ${msg}`)
}

function fail(msg) {
  console.error(`[build:update-package] ERRO: ${msg}`)
  process.exit(1)
}

function readVersion() {
  const versionFile = path.join(ROOT, 'VERSION')
  if (fs.existsSync(versionFile)) {
    const v = fs.readFileSync(versionFile, 'utf8').trim()
    if (!v) fail('Arquivo VERSION está vazio.')
    return v
  }
  const pkgPath = path.join(ROOT, 'package.json')
  if (!fs.existsSync(pkgPath)) fail('VERSION não encontrado e package.json raiz ausente.')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  if (!pkg.version) fail('VERSION não encontrado e package.json não tem campo "version".')
  return String(pkg.version)
}

/**
 * Resolve a próxima versão: bump automático (padrão), --set-version ou --no-bump.
 * Se VERSION já estiver à frente do último pacote publicado, reutiliza (bump manual prévio).
 */
function resolveReleaseVersion() {
  const current = readVersion()
  parseSemver(current)

  const published =
    readLatestPublished(UPDATES_JSON) || readLatestPublished(PANEL_UPDATES_JSON)

  if (setVersion) {
    parseSemver(setVersion)
    writeVersion(ROOT, setVersion)
    log(`VERSION definida: ${current} → ${setVersion}`)
    return { version: setVersion, fromVersion: published || current }
  }

  if (noBump) {
    log(`VERSION mantida (--no-bump): ${current}`)
    return { version: current, fromVersion: published && published !== current ? published : null }
  }

  if (!['major', 'minor', 'patch'].includes(bumpLevel)) {
    fail(`--bump inválido (${bumpLevel}). Use major, minor ou patch.`)
  }

  // Já adiantou VERSION manualmente em relação ao último ZIP → não sobe de novo.
  if (published && current !== published) {
    try {
      const a = parseSemver(current)
      const b = parseSemver(published)
      const ahead =
        a.major > b.major ||
        (a.major === b.major && a.minor > b.minor) ||
        (a.major === b.major && a.minor === b.minor && a.patch > b.patch)
      if (ahead) {
        log(`VERSION ${current} já à frente de ${published} — sem bump extra.`)
        return { version: current, fromVersion: published }
      }
    } catch {
      /* segue com bump */
    }
  }

  const next = bumpSemver(current, /** @type {'major'|'minor'|'patch'} */ (bumpLevel))
  writeVersion(ROOT, next)
  log(`VERSION atualizada (${bumpLevel}): ${current} → ${next}`)
  return { version: next, fromVersion: published || current }
}

function resolveChangelog(version, fromVersion) {
  if (changelogOverride) {
    log('Changelog: informado via --changelog')
    changelogSnapshot = null
    return changelogOverride
  }
  const updatesJson = fs.existsSync(UPDATES_JSON) ? UPDATES_JSON : PANEL_UPDATES_JSON
  const stampPath = changelogStampPath(path.dirname(updatesJson))
  const result = autoChangelog({
    root: ROOT,
    fromVersion: fromVersion || '',
    toVersion: version,
    updatesJsonPath: updatesJson,
    stampPath,
  })
  changelogSnapshot = result.snapshot
  log(
    `Changelog: ${result.changedFiles.length} arquivo(s) desde o último pacote → frases para o usuário`,
  )
  return result.text
}

function sha256File(filePath) {
  const hash = createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}

function copyDirExcept(src, dest, skipNames = new Set()) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirExcept(from, to, skipNames)
    else fs.copyFileSync(from, to)
  }
}

function removeIfExists(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
}

function listFilesRecursive(dir, base = dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full, base))
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
  return out
}

function runBuilds() {
  if (skipBuild) {
    log('--skip-build informado: reusando dist/ e editor/dist/ existentes.')
    if (!fs.existsSync(BIO_DIST) || !fs.existsSync(EDITOR_DIST)) {
      fail('--skip-build usado mas dist/ ou editor/dist/ não existem. Rode sem --skip-build.')
    }
    return
  }
  // Paths relativos (./) — mesmo pacote serve plataforma /{slug}/ e self-hosted.
  const env = { ...process.env, TEMPLATE_BUILD: '1' }
  log('Rodando build da bio (TEMPLATE_BUILD=1, base relativa)…')
  execSync('npm run build', { cwd: path.join(ROOT, 'bio'), env, stdio: 'inherit' })
  log('Rodando build do editor (hostgator-template)…')
  execSync('npm run build:hostgator-template', { cwd: path.join(ROOT, 'editor'), env, stdio: 'inherit' })
}

function stageVersion(version) {
  const stagingRoot = path.join(UPDATES_DIR, '_staging', version)
  removeIfExists(stagingRoot)

  const siteStage = path.join(stagingRoot, 'site')
  const editorStage = path.join(stagingRoot, 'editor')

  if (!fs.existsSync(BIO_DIST)) fail(`dist/ não encontrado (${BIO_DIST}). Build da bio falhou?`)
  if (!fs.existsSync(EDITOR_DIST)) fail(`editor/dist/ não encontrado (${EDITOR_DIST}). Build do editor falhou?`)

  // 'updates' é excluído porque dist/updates/ (saída deste script) fica DENTRO de dist/ —
  // sem isso, rodar o script duas vezes zip-aria o próprio zip anterior.
  copyDirExcept(BIO_DIST, siteStage, new Set(['updates']))
  copyDirExcept(EDITOR_DIST, editorStage, new Set())

  // Gate PHP genérico da raiz (o build da bio/dist não contém PHP).
  for (const [src, dest] of GATE_SITE_FILES) {
    const from = path.join(GATE_DIR, src)
    if (!fs.existsSync(from)) {
      fail(`Arquivo de gate ausente: ${from} — o update não conseguiria atualizar o gate do cliente.`)
    }
    fs.copyFileSync(from, path.join(siteStage, dest))
  }

  // Guard-rail: remover defensivamente qualquer arquivo sensível que porventura
  // tenha vazado para dentro do build (não deveria acontecer, mas é barato conferir).
  for (const rel of SENSITIVE_FILES) {
    removeIfExists(path.join(siteStage, rel))
    removeIfExists(path.join(editorStage, rel))
  }

  // Só bundles Vite no site/assets (apply já ignora imagens; reduz o ZIP).
  const siteAssets = path.join(siteStage, 'assets')
  if (fs.existsSync(siteAssets)) {
    for (const name of fs.readdirSync(siteAssets)) {
      if (!isViteBundleFile(name)) {
        fs.rmSync(path.join(siteAssets, name), { recursive: true, force: true })
      }
    }
  }
  for (const name of ['demo-bio.json', 'demo.html', 'logo-instabio.svg']) {
    removeIfExists(path.join(editorStage, name))
  }

  return { stagingRoot, siteStage, editorStage }
}

function buildManifest(version, siteStage, editorStage) {
  const files = []
  for (const rel of listFilesRecursive(siteStage)) {
    files.push({ path: `site/${rel}`, sha256: sha256File(path.join(siteStage, rel)) })
  }
  for (const rel of listFilesRecursive(editorStage)) {
    files.push({ path: `editor/${rel}`, sha256: sha256File(path.join(editorStage, rel)) })
  }

  return {
    version,
    layout: 'unified-v1',
    siteRoot: 'site',
    editorRoot: 'editor',
    preserve: PRESERVE_LIST,
    changelog,
    files,
  }
}

async function zipStaging(stagingRoot, manifest, zipPath) {
  removeIfExists(zipPath)
  fs.mkdirSync(path.dirname(zipPath), { recursive: true })

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    // archiver v8+ é ESM com named export (sem default)
    const archive = new ZipArchive({ zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err)
    })

    archive.pipe(output)
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
    archive.directory(path.join(stagingRoot, 'site'), 'site')
    archive.directory(path.join(stagingRoot, 'editor'), 'editor')
    archive.finalize()
  })
}

function updateUpdatesJson(version, zipFileName, zipSha256, zipSize) {
  fs.mkdirSync(UPDATES_DIR, { recursive: true })

  let data = { latest: null, releasedAt: null, minPhp: '7.4', packages: {} }
  if (fs.existsSync(UPDATES_JSON)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(UPDATES_JSON, 'utf8'))
      if (parsed && typeof parsed === 'object') data = { ...data, ...parsed }
      if (!data.packages || typeof data.packages !== 'object') data.packages = {}
    } catch {
      log('updates.json existente inválido — recriando do zero.')
    }
  }

  const releasedAt = new Date().toISOString()

  data.latest = version
  data.releasedAt = releasedAt
  data.packages[version] = {
    url: zipFileName, // referência interna (nome do arquivo) — NÃO é URL pública, ver Fase C/D
    sha256: zipSha256,
    size: zipSize,
    releasedAt,
    changelog,
  }

  fs.writeFileSync(UPDATES_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data
}

async function main() {
  const { version, fromVersion } = resolveReleaseVersion()
  changelog = resolveChangelog(version, fromVersion)
  log(`Versão do pacote: ${version}`)
  if (changelog) {
    for (const line of changelog.split('\n').slice(0, 12)) {
      log(`  | ${line}`)
    }
    if (changelog.split('\n').length > 12) log('  | …')
  }

  runBuilds()

  const { stagingRoot, siteStage, editorStage } = stageVersion(version)
  log('Staging montado, gerando manifest.json interno…')

  const manifest = buildManifest(version, siteStage, editorStage)

  const zipFileName = `insta-bio-${version}.zip`
  const zipPath = path.join(UPDATES_DIR, zipFileName)

  log('Compactando ZIP…')
  await zipStaging(stagingRoot, manifest, zipPath)

  const zipStat = fs.statSync(zipPath)
  const zipSha256 = sha256File(zipPath)

  if (zipStat.size > MAX_ZIP_SIZE_WARN) {
    log(
      `AVISO: zip com ${(zipStat.size / 1024 / 1024).toFixed(1)}MB — acima do limite de 50MB planejado para o apply (Fase D).`,
    )
  }

  const data = updateUpdatesJson(version, zipFileName, zipSha256, zipStat.size)

  // Cópia para o painel ler fora do docroot público (Fase C)
  const panelUpdatesDir = path.join(ROOT, 'panel', 'data', 'updates')
  fs.mkdirSync(panelUpdatesDir, { recursive: true })
  fs.copyFileSync(UPDATES_JSON, path.join(panelUpdatesDir, 'updates.json'))
  fs.copyFileSync(zipPath, path.join(panelUpdatesDir, zipFileName))
  fs.writeFileSync(
    path.join(panelUpdatesDir, '.htaccess'),
    `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
`,
  )
  log(`  espelho em panel/data/updates/ (updates.json + zip + .htaccess Deny)`)

  // Marca o estado dos fontes desta build — a próxima só lista o que mudou depois.
  const snapshot = changelogSnapshot || snapshotProductFiles(ROOT)
  writeChangelogStamp(changelogStampPath(UPDATES_DIR), version, snapshot)
  writeChangelogStamp(changelogStampPath(panelUpdatesDir), version, snapshot)
  log(`  changelog-stamp.json gravado (base da próxima build)`)

  // Limpa toda a pasta _staging (não só a subpasta da versão), para não deixar diretório vazio.
  removeIfExists(path.join(UPDATES_DIR, '_staging'))
  void stagingRoot

  log('Concluído:')
  log(`  ${zipPath}`)
  log(`  sha256: ${zipSha256}`)
  log(`  size: ${zipStat.size} bytes`)
  log(`  ${UPDATES_JSON} (latest=${data.latest})`)
}

main().catch((err) => {
  fail(err.stack || err.message || String(err))
})
