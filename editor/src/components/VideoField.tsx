import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { useDemoMode } from '../context/DemoModeContext'
import { ENDPOINTS } from '../lib/endpoints'

interface VideoFieldProps {
  label: string
  value?: string
  onChange: (value: string | undefined) => void
  hint?: string
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function VideoField({ label, value, onChange, hint }: VideoFieldProps) {
  const isDemo = useDemoMode()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const data = await readAsBase64(file)
      const response = await fetch(ENDPOINTS.upload, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Falha no upload')
      }
      const result = (await response.json()) as { path: string }
      onChange(result.path)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no upload'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field">
      <label>{label}</label>

      <div className="flex items-stretch gap-3 rounded-lg border border-border bg-muted/30 p-3">
        {value ? (
          <video
            src={resolvePublicUrl(value)}
            className="aspect-[9/16] h-auto w-20 shrink-0 self-stretch rounded-lg border border-border object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex aspect-[9/16] w-20 shrink-0 items-center justify-center self-stretch rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
            sem vídeo
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {!isDemo && (
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? 'Enviando…' : 'Enviar vídeo'}
              </button>
            )}
            {value && (
              <button
                type="button"
                className="btn-danger inline-flex shrink-0 items-center justify-center px-3 py-1.5"
                onClick={() => onChange(undefined)}
                title="Remover vídeo"
                aria-label="Remover vídeo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="assets/video.mp4"
            className="text-xs"
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.currentTarget.value = ''
        }}
      />

      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      {isDemo && !error && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Na versão completa você envia vídeos pelo editor.
        </p>
      )}
      {hint && !error && !isDemo && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
