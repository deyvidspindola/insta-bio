import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { BioConfig } from '@bio-types'
import { BioPage } from '@site/components/BioPage'
import { setBioJsonRelativePath, pageRelativeUrl } from '@site/lib/publicUrl'
import './preview.css'

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
      }
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'bio-preview-ready' }, '*')

    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Aguardando preview…
      </div>
    )
  }

  return <BioPage config={config} />
}

createRoot(document.getElementById('root')!).render(<PreviewApp />)
