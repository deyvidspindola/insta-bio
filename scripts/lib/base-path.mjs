/** Normaliza o caminho público: sempre começa e termina com /. Raiz = "/" */
export function normalizeBasePath(input) {
  if (input === undefined || input === null || input === '' || input === '/') {
    return '/'
  }

  let value = String(input).trim()
  if (!value.startsWith('/')) value = `/${value}`
  if (!value.endsWith('/')) value = `${value}/`
  return value
}

/** Base do editor a partir do base público: /editor/ ou /insta-bio/editor/ */
export function editorBaseFrom(publicBase) {
  if (publicBase === '/') return '/editor/'
  return `${publicBase}editor/`
}
