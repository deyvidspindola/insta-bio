import type { YoutubeEmbedCard as YoutubeEmbedCardType } from '../types/bio'
import { youtubeEmbedUrl } from '../lib/embedUrls'
import { BioVideoCaption } from './BioVideoCaption'

export function YoutubeEmbedCard({ item }: { item: YoutubeEmbedCardType }) {
  const embed = youtubeEmbedUrl(item.url)

  if (!embed) {
    return (
      <div className="bio-embed-card bio-embed-card--error rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Cole um link válido do YouTube (vídeo ou Shorts).
      </div>
    )
  }

  const hasCaption = Boolean(item.title?.trim() || item.caption?.trim())

  return (
    <div className="bio-embed-card bio-embed-card--youtube">
      <div
        className={`bio-embed-card__frame bio-embed-card__frame--video relative overflow-hidden rounded-2xl border border-border bg-black/40 ${
          hasCaption ? 'bio-embed-card__frame--captioned' : ''
        }`}
      >
        <iframe
          src={embed}
          title={item.title || 'Vídeo do YouTube'}
          className="aspect-video h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <BioVideoCaption title={item.title} caption={item.caption} />
      </div>
    </div>
  )
}
