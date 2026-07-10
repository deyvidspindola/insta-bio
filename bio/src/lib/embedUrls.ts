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

/** Converte URL pública do Spotify em URL de embed oficial (legado). */
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

export interface SpotifyEmbedParsed {
  src: string
  height: number
}

const SPOTIFY_EMBED_DEFAULT_HEIGHT = 152

/** Aceita iframe exportado pelo Spotify, URL de embed ou link público (legado). */
export function parseSpotifyEmbed(input: string): SpotifyEmbedParsed | null {
  const raw = input.trim()
  if (!raw) return null

  const iframeTag = raw.match(/<iframe[\s\S]*?>/i)?.[0]
  if (iframeTag) {
    const src = iframeTag.match(/\bsrc=["']([^"']+)["']/i)?.[1]?.trim()
    if (!src || !isSpotifyEmbedSrc(src)) return null

    const heightRaw = iframeTag.match(/\bheight=["']?(\d+)["']?/i)?.[1]
    const height = heightRaw ? Number.parseInt(heightRaw, 10) : SPOTIFY_EMBED_DEFAULT_HEIGHT

    return {
      src,
      height: Number.isFinite(height) && height > 0 ? height : SPOTIFY_EMBED_DEFAULT_HEIGHT,
    }
  }

  if (raw.includes('open.spotify.com/embed/')) {
    try {
      const src = new URL(raw.startsWith('http') ? raw : `https://${raw}`).toString()
      if (!isSpotifyEmbedSrc(src)) return null
      return { src, height: SPOTIFY_EMBED_DEFAULT_HEIGHT }
    } catch {
      return null
    }
  }

  const legacy = spotifyEmbedUrl(raw)
  if (legacy) {
    return { src: legacy, height: SPOTIFY_COMPACT_HEIGHT }
  }

  return null
}

function isSpotifyEmbedSrc(src: string): boolean {
  try {
    const url = new URL(src)
    return url.hostname.replace(/^www\./, '') === 'open.spotify.com' && url.pathname.startsWith('/embed/')
  } catch {
    return false
  }
}

/** Player compacto Spotify — altura padrão do embed exportado. */
export const SPOTIFY_COMPACT_HEIGHT = 152

export function spotifyEmbedHeight(_mode?: 'compact' | 'default'): number {
  return SPOTIFY_COMPACT_HEIGHT
}
