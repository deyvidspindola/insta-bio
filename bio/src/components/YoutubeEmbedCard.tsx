import type { YoutubeEmbedCard as YoutubeEmbedCardType } from '../types/bio'
import { youtubeEmbedUrl } from '../lib/embedUrls'

export function YoutubeEmbedCard({ item }: { item: YoutubeEmbedCardType }) {
  const embed = youtubeEmbedUrl(item.url)

  if (!embed) {
    return (
      <div className="bio-embed-card bio-embed-card--error rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Cole um link válido do YouTube (vídeo ou Shorts).
      </div>
    )
  }

  return (
    <div className="bio-embed-card bio-embed-card--youtube">
      {item.title && (
        <p className="bio-embed-card__title mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {item.title}
        </p>
      )}
      <div className="bio-embed-card__frame bio-embed-card__frame--video overflow-hidden rounded-2xl border border-border bg-black/40">
        <iframe
          src={embed}
          title={item.title || 'Vídeo do YouTube'}
          className="aspect-video h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}
