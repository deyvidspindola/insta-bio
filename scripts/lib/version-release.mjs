import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/** Áreas de produto consideradas no changelog da build. */
const CLIENT_PATHS = [
  'bio/src',
  'bio/public',
  'editor/src',
  'editor/php',
  'editor/scripts',
  'panel/php',
  'panel/server',
  'scripts',
  'deploy',
]

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.update-tmp',
  '.update-backup',
  'vendor',
])

const SKIP_FILE_NAMES = new Set([
  'update.log',
  'update.log.1',
  'update-state.json',
  'auth.config.php',
  'platform-api.json',
  'bio.json',
  'bio.draft.json',
])

/**
 * Regras: caminho → frase para o usuário final (sem nomes de arquivo).
 * Ordem importa: regras mais específicas primeiro.
 */
const CHANGE_RULES = [
  {
    test: /(FeatureCard|feature.*align|FEATURE_ALIGNS)/i,
    phrase: 'Melhoria no card de destaque',
  },
  {
    test: /(AppHeroCard|whatsapp-hero|app-hero|appHeroPresets)/i,
    phrase: 'Melhoria nos cards de WhatsApp e apps',
  },
  {
    test: /(IconPicker|iconCatalog)/i,
    phrase: 'Melhoria no seletor de ícones',
  },
  {
    test: /(ItemEditor|SectionEditor|SectionSidebar)/i,
    phrase: 'Melhorias na edição de seções e cards',
  },
  {
    test: /(AppearanceForm|backgroundPresets|cardRadius|templates)/i,
    phrase: 'Melhorias nas opções de aparência',
  },
  {
    test: /(IdentityForm|pageMeta|socialLinks)/i,
    phrase: 'Melhorias na identidade e SEO da bio',
  },
  {
    test: /(ImagesGallery|ImageField|upload\.php|list-images|delete-image)/i,
    phrase: 'Melhorias na galeria de imagens',
  },
  {
    test: /(VideoCard|VideoField|SlideCard|ProductsCard|LocationCard|GridCard)/i,
    phrase: 'Novo card ou melhoria em cards da bio',
  },
  {
    test: /(UpdateAvailable|update-prompt|INSTRUCOES-FASE-F)/i,
    phrase: 'Aviso de nova versão ao entrar no editor',
  },
  {
    test: /(UpdatesCard|update-apply|update-check|update-status|update-log|updates\.ts|vite-bundles)/i,
    phrase: 'Melhoria no fluxo de atualização',
  },
  {
    test: /(LoginScreen|login\.php|session\.php|auth\.config)/i,
    phrase: 'Melhorias no login do editor',
  },
  {
    test: /(AdvancedPanel|ConfirmDialog)/i,
    phrase: 'Melhorias nas configurações do editor',
  },
  {
    test: /(PreviewPanel|PreviewSheet|preview\.html)/i,
    phrase: 'Melhorias no preview da bio',
  },
  {
    test: /(BioPage|BioHeader|BioSection)\.[jt]sx?$/i,
    phrase: 'Melhorias na bio pública',
  },
  {
    test: /EditorApp\.[jt]sx?$/i,
    phrase: 'Melhorias gerais no editor',
  },
  {
    test: /(build-update-package|package-platform|package-core|sync-clients-template)\.mjs$/i,
    phrase: 'Melhoria na geração e distribuição de atualizações',
  },
  {
    test: /(updates-package|updates-check|updates-download|panel\/php\/lib\/updates)\.php$/i,
    phrase: 'Melhorias na plataforma de atualizações',
  },
  {
    test: /(deploy\/apache\/|\.htaccess$)/i,
    phrase: 'Ajustes de segurança e publicação no servidor',
  },
]

/**
 * @param {string} version
 * @returns {{ major: number, minor: number, patch: number }}
 */
export function parseSemver(version) {
  const m = String(version)
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/)
  if (!m) throw new Error(`Versão inválida (esperado SemVer X.Y.Z): ${version}`)
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

/**
 * @param {string} version
 * @param {'major' | 'minor' | 'patch'} level
 */
export function bumpSemver(version, level = 'patch') {
  const v = parseSemver(version)
  if (level === 'major') return `${v.major + 1}.0.0`
  if (level === 'minor') return `${v.major}.${v.minor + 1}.0`
  return `${v.major}.${v.minor}.${v.patch + 1}`
}

/**
 * @param {string} root
 * @param {string} version
 */
export function writeVersion(root, version) {
  parseSemver(version)
  fs.writeFileSync(path.join(root, 'VERSION'), `${version}\n`, 'utf8')
}

/**
 * @param {string} updatesJsonPath
 * @returns {string | null}
 */
export function readLatestPublished(updatesJsonPath) {
  if (!fs.existsSync(updatesJsonPath)) return null
  try {
    const data = JSON.parse(fs.readFileSync(updatesJsonPath, 'utf8'))
    return data?.latest ? String(data.latest) : null
  } catch {
    return null
  }
}

export function changelogStampPath(updatesDir) {
  return path.join(updatesDir, 'changelog-stamp.json')
}

/**
 * @param {string[]} files
 * @returns {string[]}
 */
export function phrasesFromFiles(files) {
  const phrases = []
  const seen = new Set()

  for (const rule of CHANGE_RULES) {
    if (seen.has(rule.phrase)) continue
    const hit = files.some((file) => rule.test.test(file))
    if (!hit) continue
    seen.add(rule.phrase)
    phrases.push(rule.phrase)
  }

  return phrases
}

function shouldSkipDir(name) {
  return SKIP_DIR_NAMES.has(name) || name.startsWith('.')
}

function shouldSkipFile(name) {
  if (SKIP_FILE_NAMES.has(name)) return true
  if (name.endsWith('.log')) return true
  if (name.endsWith('.map')) return true
  return false
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

/**
 * Snapshot hash → caminho relativo dos fontes relevantes.
 * @param {string} root
 * @returns {Record<string, string>}
 */
export function snapshotProductFiles(root) {
  /** @type {Record<string, string>} */
  const files = {}

  function walk(absDir, relDir) {
    if (!fs.existsSync(absDir)) return
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) continue
        walk(path.join(absDir, entry.name), path.join(relDir, entry.name))
        continue
      }
      if (!entry.isFile() || shouldSkipFile(entry.name)) continue
      const rel = path.join(relDir, entry.name).split(path.sep).join('/')
      try {
        files[rel] = hashFile(path.join(absDir, entry.name))
      } catch {
        /* ignore unreadable */
      }
    }
  }

  for (const relRoot of CLIENT_PATHS) {
    walk(path.join(root, relRoot), relRoot)
  }

  return files
}

/**
 * @param {Record<string, string>} previous
 * @param {Record<string, string>} current
 * @returns {string[]}
 */
export function changedFilesBetweenSnapshots(previous, current) {
  const changed = []
  for (const [rel, hash] of Object.entries(current)) {
    if (previous[rel] !== hash) changed.push(rel)
  }
  // Arquivos removidos não geram frase de produto na maioria dos casos.
  return changed.sort()
}

/**
 * @param {string} stampFile
 * @returns {{ version?: string, createdAt?: string, files?: Record<string, string> } | null}
 */
export function readChangelogStamp(stampFile) {
  if (!fs.existsSync(stampFile)) return null
  try {
    const data = JSON.parse(fs.readFileSync(stampFile, 'utf8'))
    if (!data || typeof data !== 'object') return null
    return data
  } catch {
    return null
  }
}

/**
 * @param {string} stampFile
 * @param {string} version
 * @param {Record<string, string>} files
 */
export function writeChangelogStamp(stampFile, version, files) {
  fs.mkdirSync(path.dirname(stampFile), { recursive: true })
  const payload = {
    version,
    createdAt: new Date().toISOString(),
    files,
  }
  fs.writeFileSync(stampFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
}

function git(root, args) {
  try {
    return execSync(`git ${args}`, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

/**
 * Fallback sem stamp: só o que está diferente do HEAD (working tree),
 * como um commit ainda não feito — não usa histórico antigo.
 * @param {string} root
 */
function dirtyProductFiles(root) {
  const pathArgs = CLIENT_PATHS.map((p) => JSON.stringify(p)).join(' ')
  return git(root, `status --porcelain -- ${pathArgs}`)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[MADRCU?!]{1,2}\s+/, '').replace(/^.* -> /, ''))
    .filter(
      (f) =>
        !f.includes('.update-backup/') &&
        !f.includes('.update-tmp/') &&
        !SKIP_FILE_NAMES.has(path.basename(f)),
    )
}

/**
 * Gera changelog só com o que mudou nesta build (desde o último pacote).
 *
 * @param {object} opts
 * @param {string} opts.root
 * @param {string} opts.fromVersion
 * @param {string} opts.toVersion
 * @param {string} [opts.updatesJsonPath]
 * @param {string} [opts.stampPath]
 */
export function autoChangelog({ root, fromVersion, toVersion, updatesJsonPath, stampPath }) {
  void updatesJsonPath

  const stampFile =
    stampPath ||
    (updatesJsonPath
      ? changelogStampPath(path.dirname(updatesJsonPath))
      : path.join(root, 'dist', 'updates', 'changelog-stamp.json'))

  const current = snapshotProductFiles(root)
  const stamp = readChangelogStamp(stampFile)
  const previous = stamp?.files && typeof stamp.files === 'object' ? stamp.files : null

  let changed = []
  if (previous) {
    changed = changedFilesBetweenSnapshots(previous, current)
  } else {
    // Primeira build com stamp: usa só working tree sujo (não o histórico inteiro).
    changed = dirtyProductFiles(root)
    if (changed.length === 0) {
      // Repo limpo sem stamp — sem base; evita inventar frases do passado.
      changed = []
    }
  }

  const phrases = phrasesFromFiles(changed).slice(0, 8)
  const lines = [
    `Atualização ${toVersion}` + (fromVersion ? ` (desde ${fromVersion})` : ''),
    '',
  ]

  if (phrases.length === 0) {
    lines.push(
      previous
        ? 'Pacote regenerado sem novas alterações de produto.'
        : 'Atualização do template nesta versão.',
    )
  } else {
    for (const phrase of phrases) {
      lines.push(`- ${phrase}`)
    }
  }

  return {
    text: lines.join('\n'),
    changedFiles: changed,
    snapshot: current,
  }
}
