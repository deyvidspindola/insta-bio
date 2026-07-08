import type { SpotifyEmbedCard as SpotifyEmbedCardType } from '../types/bio'
import { SPOTIFY_COMPACT_HEIGHT, spotifyEmbedUrl } from '../lib/embedUrls'

export function SpotifyEmbedCard({ item }: { item: SpotifyEmbedCardType }) {
  const theme = item.theme ?? 'dark'
  const embed = spotifyEmbedUrl(item.url, { theme })
  const height = SPOTIFY_COMPACT_HEIGHT

  if (!embed) {
    return (
      <div className="bio-embed-card bio-embed-card--error rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Cole um link válido do Spotify (playlist, álbum, artista ou música).
      </div>
    )
  }

  return (
    <div className="bio-embed-card bio-embed-card--spotify">
      {item.title ? (
        <p className="bio-embed-card__title mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {item.title}
        </p>
      ) : null}
      <iframe
        className="w-full"
        src={embed}
        frameBorder={0}
        allow="encrypted-media"
        title={item.title || 'spotify'}
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
