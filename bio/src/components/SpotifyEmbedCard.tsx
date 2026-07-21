import type { SpotifyEmbedCard as SpotifyEmbedCardType } from '../types/bio'
import { parseSpotifyEmbed } from '../lib/embedUrls'

function spotifyEmbedInput(item: SpotifyEmbedCardType): string {
  return (item.embed ?? item.url ?? '').trim()
}

export function SpotifyEmbedCard({ item }: { item: SpotifyEmbedCardType }) {
  const parsed = parseSpotifyEmbed(spotifyEmbedInput(item))

  if (!parsed) {
    return (
      <div className="bio-embed-card bio-embed-card--error rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Cole o código de incorporação (iframe) exportado pelo Spotify.
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
        src={parsed.src}
        width="100%"
        height={parsed.height}
        frameBorder={0}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={item.title || 'Spotify'}
        style={{ borderRadius: '12px' }}
      />
    </div>
  )
}
