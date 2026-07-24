import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import type { VideoCard as VideoCardType } from '../types/bio'
import { hasClickableUrl } from '../lib/cardLink'
import {
  mediaCardAspectClass,
  mediaCardMaxWidthClass,
  resolveMediaCardVariant,
} from '../lib/mediaCardLayout'
import { resolvePublicUrl } from '../lib/publicUrl'
import { BioVideoCaption } from './BioVideoCaption'

function VideoMedia({ item }: { item: VideoCardType }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const variant = resolveMediaCardVariant(item)
  const aspect = mediaCardAspectClass(variant)
  const maxWidth = mediaCardMaxWidthClass(variant)
  const caption = item.caption?.trim() || item.description?.trim()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    if (!muted) {
      void video.play().catch(() => setMuted(true))
    }
  }, [muted])

  return (
    <div className={`bio-media-frame relative overflow-hidden ${aspect} ${maxWidth}`}>
      <video
        ref={videoRef}
        src={resolvePublicUrl(item.video)}
        poster={item.poster ? resolvePublicUrl(item.poster) : undefined}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        playsInline
        muted
        preload="metadata"
      />

      <BioVideoCaption title={item.title} caption={caption} />

      <button
        type="button"
        className="bio-video-mute-btn absolute bottom-3 right-3 z-10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMuted((current) => !current)
        }}
        aria-pressed={!muted}
        aria-label={muted ? 'Ativar som do vídeo' : 'Desativar som do vídeo'}
      >
        {muted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export function VideoCard({ item }: { item: VideoCardType }) {
  const media = <VideoMedia item={item} />

  if (hasClickableUrl(item.url)) {
    return (
      <a
        href={item.url!.trim().includes('://') ? item.url!.trim() : `https://${item.url!.trim()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bio-card bio-card--media bio-card--video group relative block w-full"
      >
        {media}
      </a>
    )
  }

  return <div className="bio-card bio-card--media bio-card--video relative block w-full">{media}</div>
}
