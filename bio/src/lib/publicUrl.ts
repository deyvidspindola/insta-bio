import { RESERVED_SLUGS } from './reservedSlugs'

declare global {
  interface Window {
    /** Injetado pelo index.php ou preview a partir do caminho do bio.json */
    __BIO_JSON_PATH__?: string
  }
}

function normalizeBase(path: string): string {
  if (!path || path === '/') return '/'
  let value = path.trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
}

/** Segmento de URL que parece domínio/pasta de hospedagem, não slug de cliente. */
function looksLikeHostname(segment: string): boolean {
  return segment.includes('.') && !segment.startsWith('.')
}

/** Detecta o prefixo público a partir da URL (multi-tenant em /{slug}/). */
function detectPublicBase(): string {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const editorIdx = parts.indexOf('editor')

  if (editorIdx > 0) {
    return normalizeBase(`/${parts.slice(0, editorIdx).join('/')}/`)
  }

  if (parts.length > 0) {
    const first = parts[0].toLowerCase()
    if (!RESERVED_SLUGS.has(first) && !looksLikeHostname(first)) {
      return normalizeBase(`/${first}/`)
    }
  }

  return '/'
}

function resolvePublicBase(): string {
  const envBase = import.meta.env.VITE_PUBLIC_BASE as string | undefined

  if (envBase && envBase !== 'auto' && envBase !== './' && envBase !== '') {
    return normalizeBase(envBase)
  }

  if (envBase === '/') return '/'

  return detectPublicBase()
}

let cachedBase: string | null = null
let bioJsonRelativePath: string | null = null

/**
 * Pasta web onde o site está publicado (mantém subpastas tipo igrejaexpressar.com.br/).
 * Remove apenas /editor/... e arquivos no final (index.html).
 */
function siteRootPath(): string {
  let pathname = window.location.pathname
  const editorIdx = pathname.indexOf('/editor')
  if (editorIdx >= 0) {
    pathname = pathname.slice(0, editorIdx)
  }
  pathname = pathname.replace(/\/[^/]*\.[a-z0-9]+$/i, '')
  if (pathname === '/' || pathname === '') return ''
  return pathname.replace(/\/$/, '')
}

function siteRootHref(): string {
  const root = siteRootPath()
  const path = root === '' ? '/' : `${root}/`
  return new URL(path, window.location.origin).href
}

/** URL relativa à raiz do site (bio pública, preview em /editor/preview, etc.). */
export function pageRelativeUrl(relative: string): string {
  const clean = relative.replace(/^\//, '')
  return new URL(clean, siteRootHref()).href
}

/** Define o caminho relativo do bio.json (ex.: painel/bio.json). */
export function setBioJsonRelativePath(path: string): void {
  bioJsonRelativePath = path.trim().replace(/^\//, '')
}

export function getBioJsonRelativePath(): string {
  return resolvedBioJsonPath()
}

function resolvedBioJsonPath(): string {
  const fromWindow =
    typeof window !== 'undefined' ? window.__BIO_JSON_PATH__?.trim() : undefined
  return (bioJsonRelativePath ?? fromWindow ?? 'bio.json').replace(/^\//, '')
}

/** Prefixo web para assets/ — mesma pasta do bio.json (ex.: painel/). */
export function bioAssetsPrefix(): string {
  const bioPath = resolvedBioJsonPath()
  const slash = bioPath.lastIndexOf('/')
  return slash >= 0 ? bioPath.slice(0, slash + 1) : ''
}

/** Base pública do site da bio (ex.: / ou /igreja-expressar/). */
export function publicBase(): string {
  if (cachedBase === null) {
    cachedBase = resolvePublicBase()
  }
  return cachedBase
}

/** Resolve caminhos de imagens/vídeos do bio.json para a URL correta no deploy. */
export function resolvePublicUrl(path: string | undefined): string {
  if (!path) return ''
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path
  }

  const clean = path.replace(/^\//, '')
  return pageRelativeUrl(`${bioAssetsPrefix()}${clean}`)
}

export function bioJsonUrl(): string {
  return `${pageRelativeUrl(resolvedBioJsonPath())}?t=${Date.now()}`
}

/** Resolve caminho relativo salvo na config para URL de fetch. */
export function resolveBioJsonPath(relativePath: string): string {
  const value = relativePath.trim()
  if (value === '') return pageRelativeUrl('bio.json')
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return pageRelativeUrl(value.replace(/^\//, ''))
}
