import { useState } from 'react'
import { Plus } from 'lucide-react'

interface QuickAddLinkProps {
  onAdd: (title: string, url: string) => void
}

export function QuickAddLink({ onAdd }: QuickAddLinkProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  function submit() {
    onAdd(title, url)
    setTitle('')
    setUrl('')
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Adicionar link</h3>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          Título e URL. Depois você pode abrir o item para ícone, subtítulo e outras opções.
        </p>
      </div>
      <div className="field mb-0">
        <label htmlFor="quick-link-title">Título</label>
        <input
          id="quick-link-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Instagram, Agendar, Cardápio"
          autoComplete="off"
        />
      </div>
      <div className="field mb-0">
        <label htmlFor="quick-link-url">URL</label>
        <input
          id="quick-link-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          autoComplete="url"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
      </div>
      <button type="button" className="btn-primary min-h-12 w-full text-sm" onClick={submit}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Adicionar
      </button>
    </div>
  )
}
