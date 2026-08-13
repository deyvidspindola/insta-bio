import type { ReactNode } from 'react'
import type { SlideStoryItem } from '@bio-types'
import { ImageField } from './ImageField'
import { VideoField } from './VideoField'

interface SlidesFieldProps {
  slides: SlideStoryItem[]
  onChange: (slides: SlideStoryItem[]) => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

export function SlidesField({ slides, onChange }: SlidesFieldProps) {
  function updateSlide(index: number, patch: Partial<SlideStoryItem>) {
    onChange(slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)))
  }

  function removeSlide(index: number) {
    onChange(slides.filter((_, i) => i !== index))
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= slides.length) return
    const next = [...slides]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  function addSlide() {
    onChange([...slides, { image: '', duration: 5 }])
  }

  return (
    <div className="field">
      <label>Slides (stories)</label>
      <div className="space-y-3">
        {slides.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhum slide ainda.</p>
        )}
        {slides.map((slide, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Slide {index + 1}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  disabled={index === 0}
                  onClick={() => moveSlide(index, -1)}
                  aria-label="Mover slide para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, 1)}
                  aria-label="Mover slide para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-danger px-2 py-1 text-xs"
                  onClick={() => removeSlide(index)}
                >
                  Remover
                </button>
              </div>
            </div>

            <ImageField
              label="Imagem"
              value={slide.image}
              onChange={(image) =>
                updateSlide(index, { image, video: image ? undefined : slide.video })
              }
            />
            <VideoField
              label="Ou vídeo"
              value={slide.video}
              onChange={(video) =>
                updateSlide(index, { video, image: video ? undefined : slide.image })
              }
              hint="Se enviar vídeo, a imagem deste slide é ignorada."
            />
            {!slide.video && (
              <Field label="Duração (segundos)">
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={slide.duration ?? 5}
                  onChange={(e) =>
                    updateSlide(index, { duration: Number(e.target.value) || 5 })
                  }
                />
              </Field>
            )}
            <Field label="Legenda (opcional)">
              <input
                value={slide.caption ?? ''}
                onChange={(e) => updateSlide(index, { caption: e.target.value })}
              />
            </Field>
            <Field label="Link (opcional)">
              <input
                value={slide.url ?? ''}
                onChange={(e) => updateSlide(index, { url: e.target.value || undefined })}
                placeholder="https://"
              />
            </Field>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full py-1.5 text-xs" onClick={addSlide}>
        + Adicionar slide
      </button>
    </div>
  )
}
