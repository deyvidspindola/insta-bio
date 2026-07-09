/** Extrai o ID de vídeo de URLs comuns do YouTube. */
export function parseYoutubeVideoId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] ?? null
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2] ?? null
      }
      const v = url.searchParams.get('v')
      if (v) return v
    }
  } catch {
    // fall through
  }

  return null
}

export function youtubeEmbedUrl(input: string): string | null {
  const id = parseYoutubeVideoId(input)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}

/** Converte URL pública do Spotify em URL de embed oficial (limpa, sem params extras). */
export function spotifyEmbedUrl(
  input: string,
  options?: { theme?: 'dark' | 'light' },
): string | null {
  const raw = input.trim()
  if (!raw) return null

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    if (!url.hostname.replace(/^www\./, '').includes('spotify.com')) return null

    let type: string
    let id: string

    if (url.pathname.startsWith('/embed/')) {
      const match = url.pathname.match(/^\/embed\/(playlist|album|artist|track|episode|show)\/([a-zA-Z0-9]+)/)
      if (!match) return null
      type = match[1]
      id = match[2]
    } else {
      const match = url.pathname.match(/^\/(playlist|album|artist|track|episode|show)\/([a-zA-Z0-9]+)/)
      if (!match) return null
      type = match[1]
      id = match[2]
    }

    const embed = new URL(`https://open.spotify.com/embed/${type}/${id}`)
    if (options?.theme === 'light') {
      embed.searchParams.set('theme', '1')
    }

    return embed.toString()
  } catch {
    return null
  }
}

/** Player compacto Spotify — capa à esquerda + faixas (153px). */
export const SPOTIFY_COMPACT_HEIGHT = 153

export function spotifyEmbedHeight(_mode?: 'compact' | 'default'): number {
  return SPOTIFY_COMPACT_HEIGHT
}
