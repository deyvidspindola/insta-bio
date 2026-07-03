import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { BioConfig } from '@bio-types'
import { BioPage } from '@site/components/BioPage'
import './preview.css'

function PreviewApp() {
  const [config, setConfig] = useState<BioConfig | null>(null)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
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
