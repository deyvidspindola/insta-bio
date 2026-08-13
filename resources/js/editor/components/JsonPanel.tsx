import { useMemo, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { copyBioConfig, downloadBioConfig } from '../lib/bio'

interface JsonPanelProps {
  config: BioConfig
}

export function JsonPanel({ config }: JsonPanelProps) {
  const [copied, setCopied] = useState(false)

  const json = useMemo(() => JSON.stringify(config, null, 2), [config])

  const stats = useMemo(() => {
    const sections = config.sections.length
    const cards = config.sections.reduce((total, section) => total + section.items.length, 0)
    const lines = json.split('\n').length
    const size = new Blob([json]).size
    return { sections, cards, lines, size }
  }, [config, json])

  async function handleCopy() {
    await copyBioConfig(config)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">JSON gerado</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stats.sections} {stats.sections === 1 ? 'seção' : 'seções'} · {stats.cards}{' '}
            {stats.cards === 1 ? 'card' : 'cards'} · {stats.lines} linhas · {formatBytes(stats.size)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => downloadBioConfig(config)}>
            <Download className="h-4 w-4" />
            Baixar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background/60">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
          <span className="ml-2 text-[11px] text-muted-foreground">bio.json</span>
        </div>
        <pre className="max-h-[65vh] overflow-auto p-4 text-xs leading-relaxed text-foreground/90">
          {json}
        </pre>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
