/**
 * Normaliza o rodapé da bio: ano sempre atual; remove anos já gravados
 * no texto para não duplicar (ex.: "© 2024 Nome" → "© 2026 Nome").
 */
export function formatBioFooter(
  raw: string,
  year: number = new Date().getFullYear(),
): string {
  let text = raw.trim()
  if (!text) {
    return `© ${year}`
  }

  // Anos 1900–2099 no texto (copyright antigo, tipado à mão, etc.)
  text = text.replace(/\b(?:19|20)\d{2}\b/g, ' ')
  text = text.replace(/\s{2,}/g, ' ').trim()

  // Prefixo de copyright residual
  text = text
    .replace(/^©\s*/u, '')
    .replace(/^\(c\)\s*/i, '')
    .replace(/^copyright\s+/i, '')
    .trim()

  // Sobrou só pontuação / símbolos vazios
  text = text.replace(/^[\s·|–—\-]+|[\s·|–—\-]+$/g, '').trim()

  if (!text) {
    return `© ${year}`
  }

  return `© ${year} ${text}`
}
