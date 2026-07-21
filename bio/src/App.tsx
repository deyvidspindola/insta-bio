import { useEffect, useRef, useState } from 'react'
import { BioPage } from './components/BioPage'
import { trackPageview } from './lib/analytics'
import { loadBioConfig } from './lib/loadBioConfig'
import type { BioConfig } from './types/bio'

function App() {
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pageviewSent = useRef(false)

  useEffect(() => {
    loadBioConfig()
      .then(setConfig)
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!config || pageviewSent.current) return
    pageviewSent.current = true
    trackPageview()
  }, [config])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <BioPage config={config} />
}

export default App
