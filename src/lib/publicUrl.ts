import { RESERVED_SLUGS } from './reservedSlugs'

function normalizeBase(path: string): string {
  if (!path || path === '/') return '/'
  let value = path.trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
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
    if (!RESERVED_SLUGS.has(first)) {
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

/** Base pública do site da bio (ex.: / ou /igreja-expressar/). */
export function publicBase(): string {
  if (cachedBase === null) {
    cachedBase = resolvePublicBase()
  }
  return cachedBase
}

/** Resolve caminhos de imagens/arquivos do bio.json para a URL correta no deploy. */
export function resolvePublicUrl(path: string | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const normalized = path.startsWith('/') ? path.slice(1) : path
  const base = publicBase()
  if (base === '/') return `/${normalized}`
  return `${base}${normalized}`
}

export function bioJsonUrl(): string {
  const base = publicBase()
  const prefix = base === '/' ? '/' : base
  return `${prefix}bio.json?t=${Date.now()}`
}
