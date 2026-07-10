import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { BioConfig } from '@bio-types'
import { BioPage } from '@site/components/BioPage'
import { setBioJsonRelativePath, pageRelativeUrl } from '@site/lib/publicUrl'
import './preview.css'

export interface PreviewFocus {
  sectionId: string
  itemIndex: number
}

async function loadBioJsonPathFromFile(): Promise<string | null> {
  try {
    const res = await fetch(pageRelativeUrl('bio-path.json'), { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { bioJsonPath?: string }
    return data.bioJsonPath?.trim() || null
  } catch {
    return null
  }
}

function PreviewApp() {
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [focus, setFocus] = useState<PreviewFocus | null>(null)
  const lastScrolledFocusRef = useRef<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.bioPreview = '1'
  }, [])

  useEffect(() => {
    async function initPaths() {
      const injected = window.__BIO_JSON_PATH__?.trim()
      if (injected) {
        setBioJsonRelativePath(injected)
        return
      }
      const fromFile = await loadBioJsonPathFromFile()
      if (fromFile) setBioJsonRelativePath(fromFile)
    }

    void initPaths()
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (typeof event.data?.bioJsonPath === 'string' && event.data.bioJsonPath.trim()) {
        setBioJsonRelativePath(event.data.bioJsonPath)
      }
      if (event.data?.type === 'bio-preview' && event.data.config) {
        setConfig(event.data.config as BioConfig)
        const nextFocus = event.data.focus as PreviewFocus | null | undefined
        const normalized =
          nextFocus?.sectionId != null && nextFocus.itemIndex != null
            ? { sectionId: nextFocus.sectionId, itemIndex: nextFocus.itemIndex }
            : null
        setFocus((prev) => {
          if (!normalized && !prev) return prev
          if (
            prev &&
            normalized &&
            prev.sectionId === normalized.sectionId &&
            prev.itemIndex === normalized.itemIndex
          ) {
            return prev
          }
          return normalized
        })
      }
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'bio-preview-ready' }, '*')

    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Só rola quando o card em foco muda — nunca a cada edição de estilo/texto.
  useEffect(() => {
    if (!focus) {
      lastScrolledFocusRef.current = null
      return
    }
    if (!config) return

    const key = `${focus.sectionId}:${focus.itemIndex}`
    if (lastScrolledFocusRef.current === key) return

    const frame = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-preview-item="${CSS.escape(key)}"]`,
      )
      if (!el) return
      lastScrolledFocusRef.current = key
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [focus, config])

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Aguardando preview…
      </div>
    )
  }

  return <BioPage config={config} previewFocus={focus} />
}

createRoot(document.getElementById('root')!).render(<PreviewApp />)
