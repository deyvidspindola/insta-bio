import { useRef, useState } from 'react'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { ENDPOINTS } from '../lib/endpoints'

interface ImageFieldProps {
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

export function ImageField({ label, value, onChange, hint }: ImageFieldProps) {
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
      if (!response.ok) throw new Error('Falha no upload')
      const result = (await response.json()) as { path: string }
      onChange(result.path)
    } catch {
      setError('Upload disponível apenas no editor local (npm run admin). Informe o caminho manualmente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field">
      <label>{label}</label>

      <div className="flex items-stretch gap-3 rounded-lg border border-border bg-muted/30 p-3">
        {value ? (
          <img
            src={resolvePublicUrl(value)}
            alt=""
            className="aspect-square h-auto w-20 shrink-0 self-stretch rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex aspect-square w-20 shrink-0 items-center justify-center self-stretch rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
            sem img
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Enviando…' : 'Enviar imagem'}
            </button>
            {value && (
              <button
                type="button"
                className="btn-danger px-3 py-1.5 text-xs"
                onClick={() => onChange(undefined)}
              >
                Remover
              </button>
            )}
          </div>

          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="/assets/imagem.jpg"
            className="text-xs"
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.currentTarget.value = ''
        }}
      />

      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
