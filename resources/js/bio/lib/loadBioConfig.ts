import type { BioConfig } from '../types/bio'

declare global {
  interface Window {
    __BIO_CONFIG__?: BioConfig
    __BIO_JSON_PATH__?: string
    __ANALYTICS_KEY__?: string
    __ANALYTICS_URL__?: string
    __BIO_WATERMARK__?: boolean
  }
}

export async function loadBioConfig(): Promise<BioConfig> {
  if (window.__BIO_CONFIG__) {
    return window.__BIO_CONFIG__
  }

  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const url = slug ? `/api/public/bio/${encodeURIComponent(slug)}` : '/api/public/bio'
  const response = await fetch(`${url}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Não foi possível carregar a bio (${response.status})`)
  }

  return response.json() as Promise<BioConfig>
}
