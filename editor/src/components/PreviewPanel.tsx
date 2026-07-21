import { useEffect, useMemo, useRef, useState } from 'react'
import type { BioConfig } from '@bio-types'
import { getBioJsonRelativePath } from '@site/lib/publicUrl'

export interface PreviewFocus {
  sectionId: string
  itemIndex: number
}

interface PreviewPanelProps {
  config: BioConfig
  /** Layout mais compacto para sheet mobile ou coluna estreita */
  compact?: boolean
  /** Destaca e rola até o card sendo editado */
  focus?: PreviewFocus | null
  /** Clique em um card no preview → seleciona no editor */
  onSelectItem?: (focus: PreviewFocus) => void
}

/** URL do iframe de preview — demo na raiz usa /preview; editor do cliente usa ./preview.html */
function previewIframeSrc(): string {
  const base = import.meta.env.BASE_URL
  const onPlatformDemo =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/'))

  if (onPlatformDemo && (base === '/editor/' || base.endsWith('/editor/'))) {
    return '/preview.html'
  }

  // Sempre .html: em produção o Apache reescreve /preview → preview.html;
  // no painel local (Node) não há rewrite — o arquivo real é preview.html.
  if (base === './' || base.startsWith('./')) {
    return new URL('preview.html', window.location.href).pathname
  }

  return `${base}preview.html`
}

export function PreviewPanel({
  config,
  compact = false,
  focus = null,
  onSelectItem,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const previewSrc = useMemo(() => previewIframeSrc(), [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'bio-preview-ready') {
        setReady(true)
      }
      if (event.data?.type === 'bio-preview-select' && onSelectItem) {
        const sectionId = event.data.sectionId
        const itemIndex = event.data.itemIndex
        if (typeof sectionId === 'string' && typeof itemIndex === 'number') {
          onSelectItem({ sectionId, itemIndex })
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onSelectItem])

  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return

    // Coalescamos atualizações em rajada (ex.: arrastar o seletor de cor) em um
    // único envio por frame, evitando saturar a thread com re-renders do iframe.
    const frame = requestAnimationFrame(() => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'bio-preview',
          config,
          focus,
          bioJsonPath: getBioJsonRelativePath(),
        },
        '*',
      )
    })

    return () => cancelAnimationFrame(frame)
  }, [config, focus, ready])

  return (
    <div
      className={`mx-auto flex w-full flex-col overflow-hidden bg-black shadow-2xl ${
        compact
          ? 'max-w-full rounded-2xl border-2 border-border'
          : 'max-w-[390px] rounded-[2rem] border-4 border-border'
      }`}
    >
      <div className="flex shrink-0 justify-center bg-black py-2">
        <div className="h-1 w-16 rounded-full bg-muted" />
      </div>
      <iframe
        ref={iframeRef}
        src={previewSrc}
        title="Preview da bio"
        className={`w-full border-0 bg-background ${
          compact
            ? 'h-[clamp(380px,calc(100vh-10rem),700px)]'
            : 'h-[min(calc(100vh-7.5rem),860px)] min-h-[640px]'
        }`}
      />
    </div>
  )
}
