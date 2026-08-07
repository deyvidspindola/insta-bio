/** Legenda estilo Instagram Reels — título + texto sobre o vídeo. */
export function BioVideoCaption({
  title,
  caption,
  className = '',
}: {
  title?: string
  caption?: string
  className?: string
}) {
  const heading = title?.trim()
  const body = caption?.trim()
  if (!heading && !body) return null

  return (
    <div
      className={`bio-video-caption pointer-events-none absolute inset-x-0 bottom-0 z-[2] ${className}`}
    >
      <div className="bio-video-caption__fade" aria-hidden="true" />
      <div className="bio-video-caption__content">
        {heading && <p className="bio-video-caption__title">{heading}</p>}
        {body && <p className="bio-video-caption__text">{body}</p>}
      </div>
    </div>
  )
}
