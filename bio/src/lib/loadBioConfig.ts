import type { BioConfig } from '../types/bio'
import { pageRelativeUrl, setBioJsonRelativePath } from './publicUrl'

declare global {
  interface Window {
    /** Injetado pelo index.php a partir do auth.config.php do editor */
    __BIO_JSON_PATH__?: string
    /** UUID de telemetria — nunca é o license_token */
    __ANALYTICS_KEY__?: string
    /** @deprecated Preferir proxy same-origin api/analytics/track */
    __ANALYTICS_URL__?: string
  }
}

function configuredBioJsonRelativePath(): string | null {
  const injected = window.__BIO_JSON_PATH__?.trim()
  if (injected) return injected
  return null
}

async function readBioPathFromJson(): Promise<string | null> {
  try {
    const res = await fetch(pageRelativeUrl('bio-path.json'), { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { bioJsonPath?: string; bioJsonUrl?: string }
    const relative = data.bioJsonPath?.trim()
    if (relative) return relative
    const legacy = data.bioJsonUrl?.trim()
    if (legacy) return legacy.replace(/^\//, '')
  } catch {
    // ignora
  }
  return null
}

async function resolveBioJsonRelativePath(): Promise<string> {
  const injected = configuredBioJsonRelativePath()
  if (injected) return injected

  const fromFile = await readBioPathFromJson()
  if (fromFile) return fromFile

  // Fallback: PHP lê auth.config.php quando bio-path.json não existe no servidor.
  // Em dev (Node) o .php pode ser servido como texto — só aceita se for JSON de verdade.
  try {
    const probe = await fetch(pageRelativeUrl('bio-json.php'), { cache: 'no-store' })
    if (probe.ok) {
      const type = probe.headers.get('content-type') ?? ''
      if (type.includes('application/json')) return 'bio-json.php'
      const preview = (await probe.clone().text()).trimStart()
      if (preview.startsWith('{') || preview.startsWith('[')) return 'bio-json.php'
    }
  } catch {
    // ignora
  }

  return 'bio.json'
}

export async function loadBioConfig(): Promise<BioConfig> {
  const relativePath = await resolveBioJsonRelativePath()
  setBioJsonRelativePath(relativePath)
  const configPath = pageRelativeUrl(relativePath)
  const separator = configPath.includes('?') ? '&' : '?'
  const response = await fetch(`${configPath}${separator}t=${Date.now()}`, { cache: 'no-store' })

  if (!response.ok) {
    const fallback = pageRelativeUrl('bio-json.php')
    if (relativePath !== 'bio-json.php') {
      const proxyRes = await fetch(`${fallback}${separator}t=${Date.now()}`, { cache: 'no-store' })
      if (proxyRes.ok) {
        return proxyRes.json() as Promise<BioConfig>
      }
    }
    throw new Error(`Não foi possível carregar ${configPath} (${response.status})`)
  }

  return response.json() as Promise<BioConfig>
}
