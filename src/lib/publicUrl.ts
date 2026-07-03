/** Base pública do site da bio (ex.: / ou /insta-bio/). */
function publicBase(): string {
  const base = import.meta.env.VITE_PUBLIC_BASE || import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

/** Resolve caminhos de imagens/arquivos do bio.json para a URL correta no deploy. */
export function resolvePublicUrl(path: string | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${publicBase()}${normalized}`
}

export function bioJsonUrl(): string {
  // Cache-busting: hospedagem compartilhada costuma ignorar "no-store" e
  // servir um bio.json antigo. O timestamp garante sempre a versão atual.
  return `${publicBase()}bio.json?t=${Date.now()}`
}
