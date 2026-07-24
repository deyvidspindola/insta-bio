import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import type { SlideCard as SlideCardType, SlideStoryItem } from '../types/bio'
import {
  mediaCardAspectClass,
  mediaCardMaxWidthClass,
  resolveMediaCardVariant,
} from '../lib/mediaCardLayout'
import { resolvePublicUrl } from '../lib/publicUrl'
import { CardCoverImage, CardMediaFallback } from './CardCoverImage'

function slideDurationMs(slide: SlideStoryItem): number {
  if (slide.video) return 0
  return Math.max(2, slide.duration ?? 5) * 1000
}

function StoryProgress({
  total,
  activeIndex,
  progress,
}: {
  total: number
  activeIndex: number
  progress: number
}) {
  if (total <= 1) return null

  return (
    <div className="bio-slide-progress absolute inset-x-0 top-0 z-20 flex gap-1 p-2.5 pt-3">
      {Array.from({ length: total }).map((_, slideIndex) => (
        <div
          key={slideIndex}
          className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-white"
            style={{
              width:
                slideIndex < activeIndex
                  ? '100%'
                  : slideIndex === activeIndex
                    ? `${Math.min(progress, 1) * 100}%`
                    : '0%',
            }}
          />
        </div>
      ))}
    </div>
  )
}

function SlideFrame({
  slide,
  isActive,
  muted,
  onVideoEnded,
  onVideoProgress,
}: {
  slide: SlideStoryItem
  isActive: boolean
  muted: boolean
  onVideoEnded?: () => void
  onVideoProgress?: (progress: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !slide.video) return

    video.muted = muted

    if (isActive) {
      video.currentTime = 0
      void video.play().catch(() => undefined)
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, muted, slide.video])

  if (slide.video) {
    return (
      <video
        ref={videoRef}
        src={resolvePublicUrl(slide.video)}
        poster={slide.poster ? resolvePublicUrl(slide.poster) : undefined}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted={muted}
        preload="metadata"
        onEnded={onVideoEnded}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (!video.duration || !onVideoProgress) return
          onVideoProgress(video.currentTime / video.duration)
        }}
      />
    )
  }

  if (slide.image) {
    return (
      <CardCoverImage
        src={slide.image}
        alt={slide.caption ?? ''}
        fallbackSize="lg"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }

  return <CardMediaFallback size="lg" />
}

export function SlideCard({ item }: { item: SlideCardType }) {
  const slides = useMemo(
    () => item.slides.filter((slide) => slide.image || slide.video),
    [item.slides],
  )
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const variant = resolveMediaCardVariant(item)
  const aspect = mediaCardAspectClass(variant)
  const maxWidth = mediaCardMaxWidthClass(variant)
  const autoplay = item.autoplay !== false
  const currentSlide = slides[index]
  const isVideoSlide = Boolean(currentSlide?.video)

  const goNext = useCallback(() => {
    if (slides.length <= 1) {
      setProgress(0)
      return
    }
    setIndex((current) => (current + 1) % slides.length)
    setProgress(0)
  }, [slides.length])

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return
    setIndex((current) => (current - 1 + slides.length) % slides.length)
    setProgress(0)
  }, [slides.length])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    setIndex(0)
    setProgress(0)
    setMuted(true)
  }, [slides])

  useEffect(() => {
    setMuted(true)
    setProgress(0)
  }, [index])

  useEffect(() => {
    clearTimer()
    if (!autoplay || paused || slides.length <= 1) return

    const slide = slides[index]
    if (!slide || slide.video) return

    const duration = slideDurationMs(slide)
    if (duration <= 0) return

    startedAtRef.current = performance.now()

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current
      const nextProgress = elapsed / duration
      if (nextProgress >= 1) {
        goNext()
        return
      }
      setProgress(nextProgress)
    }, 50)

    return clearTimer
  }, [autoplay, clearTimer, goNext, index, paused, slides])

  if (slides.length === 0) {
    return (
      <div className="bio-card bio-card--media bio-card--slide relative block w-full">
        <div
          className={`bio-media-frame bio-slide-frame relative flex items-center justify-center overflow-hidden bg-black/20 ${aspect} ${maxWidth}`}
        >
          <p className="text-sm text-white/70">Adicione slides no editor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bio-card bio-card--media bio-card--slide group relative block w-full">
      <div
        className={`bio-media-frame bio-slide-frame relative overflow-hidden ${aspect} ${maxWidth}`}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={`${slide.image ?? ''}-${slide.video ?? ''}-${slideIndex}`}
            className={`absolute inset-0 transition-opacity duration-300 ${
              slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={slideIndex !== index}
          >
            {slide.url ? (
              <a
                href={slide.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-[1]"
                aria-label={slide.caption ?? 'Abrir link do slide'}
              />
            ) : null}
            <SlideFrame
              slide={slide}
              isActive={slideIndex === index}
              muted={muted}
              onVideoEnded={goNext}
              onVideoProgress={setProgress}
            />
            {slide.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 pr-14">
                <p className="text-sm font-medium text-white drop-shadow-sm">{slide.caption}</p>
              </div>
            )}
          </div>
        ))}

        <StoryProgress total={slides.length} activeIndex={index} progress={progress} />

        {item.title && (
          <div className="pointer-events-none absolute left-0 right-0 top-8 z-20 px-3">
            <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wider text-white/90 drop-shadow">
              {item.title}
            </p>
          </div>
        )}

        {isVideoSlide && (
          <button
            type="button"
            className="bio-video-mute-btn absolute bottom-3 right-3 z-40"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMuted((current) => !current)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-pressed={!muted}
            aria-label={muted ? 'Ativar som do vídeo' : 'Desativar som do vídeo'}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="bio-slide-nav bio-slide-nav--prev absolute left-0 top-0 z-30 h-full w-1/3"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Slide anterior"
            />
            <button
              type="button"
              className="bio-slide-nav bio-slide-nav--next absolute right-0 top-0 z-30 h-full w-1/3"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goNext()
              }}
              aria-label="Próximo slide"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronLeft className="h-5 w-5 text-white/80" aria-hidden="true" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center pr-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRight className="h-5 w-5 text-white/50" aria-hidden="true" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
