/** Slugs que não podem ser usados por clientes (rotas do sistema + landing). */
export const RESERVED_SLUGS = new Set([
  'panel',
  'editor',
  'api',
  'assets',
  '_template',
  'template',
  'admin',
  'www',
  'mail',
  'ftp',
  'cdn',
  'static',
  'public',
  'release',
  'precos',
  'pricing',
  'login',
  'signup',
  'cadastro',
  'contato',
  'sobre',
  'blog',
  'docs',
  'status',
  'health',
])

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateSlug(slug: string): string | null {
  const value = normalizeSlug(slug)
  if (value.length < 3) return 'Slug deve ter pelo menos 3 caracteres'
  if (value.length > 40) return 'Slug deve ter no máximo 40 caracteres'
  if (!SLUG_PATTERN.test(value)) {
    return 'Use apenas letras minúsculas, números e hífen (sem começar/terminar com hífen)'
  }
  if (RESERVED_SLUGS.has(value)) return 'Este slug está reservado pelo sistema'
  return null
}
