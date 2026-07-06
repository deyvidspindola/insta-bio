import { useEffect, useRef, useState } from 'react'
import type { BioConfig } from '@bio-types'

interface PreviewPanelProps {
  config: BioConfig
  /** Layout mais compacto para sheet mobile ou coluna estreita */
  compact?: boolean
}

export function PreviewPanel({ config, compact = false }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'bio-preview-ready') {
        setReady(true)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return

    // Coalescamos atualizações em rajada (ex.: arrastar o seletor de cor) em um
    // único envio por frame, evitando saturar a thread com re-renders do iframe.
    const frame = requestAnimationFrame(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'bio-preview', config }, '*')
    })

    return () => cancelAnimationFrame(frame)
  }, [config, ready])

  return (
    <div
      className={`mx-auto w-full overflow-hidden bg-black shadow-2xl ${
        compact
          ? 'max-w-full rounded-2xl border-2 border-border'
          : 'max-w-[390px] rounded-[2rem] border-4 border-border'
      }`}
    >
      <div className="flex justify-center bg-black py-2">
        <div className="h-1 w-16 rounded-full bg-muted" />
      </div>
      <iframe
        ref={iframeRef}
        src={`${import.meta.env.BASE_URL}preview.html`}
        title="Preview da bio"
        className={`w-full border-0 bg-background ${
          compact
            ? 'h-[min(560px,calc(100vh-11rem))]'
            : 'h-[min(680px,calc(100vh-9rem))]'
        }`}
      />
    </div>
  )
}
