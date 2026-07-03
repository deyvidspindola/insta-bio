import { useEffect, useRef, useState } from 'react'
import type { BioConfig } from '@bio-types'

interface PreviewPanelProps {
  config: BioConfig
}

export function PreviewPanel({ config }: PreviewPanelProps) {
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
    <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-4 border-border bg-black shadow-2xl">
      <div className="flex justify-center bg-black py-2">
        <div className="h-1 w-16 rounded-full bg-muted" />
      </div>
      <iframe
        ref={iframeRef}
        src={`${import.meta.env.BASE_URL}preview.html`}
        title="Preview da bio"
        className="h-[min(680px,calc(100vh-9rem))] w-full border-0 bg-background"
      />
    </div>
  )
}
