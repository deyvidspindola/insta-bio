import type { BioConfig } from '@bio-types'
import { ENDPOINTS } from './endpoints'

export type SessionState = {
  authenticated: boolean
  user: string | null
}

type PlatformAuthConfig = {
  remoteAuth: boolean
  loginUrl?: string
  sessionUrl?: string
  slug?: string
  token?: string
}

let platformAuthConfigCache: PlatformAuthConfig | undefined

function platformApiJsonUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  // Build com base relativa (./) — resolve a partir da URL atual do editor
  if (base === './' || base.startsWith('./')) {
    return new URL('platform-api.json', window.location.href).href
  }
  const normalized = base.endsWith('/') ? base : `${base}/`
  return new URL('platform-api.json', normalized).href
}

function isRemotePlatformAuth(data: PlatformAuthConfig | null | undefined): data is PlatformAuthConfig & {
  loginUrl: string
  sessionUrl: string
  slug: string
  token: string
} {
  return Boolean(
    data?.remoteAuth && data.loginUrl && data.sessionUrl && data.slug && data.token,
  )
}

async function loadPlatformAuthConfig(): Promise<PlatformAuthConfig> {
  if (platformAuthConfigCache !== undefined) {
    return platformAuthConfigCache
  }

  try {
    const res = await fetch(platformApiJsonUrl(), { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as PlatformAuthConfig
      if (isRemotePlatformAuth(data)) {
        platformAuthConfigCache = data
        return platformAuthConfigCache
      }
    }
  } catch {
    // JSON estático ausente — tenta PHP abaixo
  }

  try {
    const res = await fetch(ENDPOINTS.platformConfig, { cache: 'no-store' })
    if (!res.ok) {
      platformAuthConfigCache = { remoteAuth: false }
      return platformAuthConfigCache
    }
    const data = (await res.json()) as PlatformAuthConfig
    platformAuthConfigCache = isRemotePlatformAuth(data) ? data : { remoteAuth: false }
    return platformAuthConfigCache
  } catch {
    platformAuthConfigCache = { remoteAuth: false }
    return platformAuthConfigCache
  }
}

export async function fetchSession(): Promise<SessionState> {
  const res = await fetch(ENDPOINTS.session, { credentials: 'include' })
  if (!res.ok) return { authenticated: false, user: null }

  const localData = (await res.json()) as SessionState
  if (!localData.authenticated || !localData.user) {
    return localData
  }

  const platformAuth = await loadPlatformAuthConfig()
  if (
    platformAuth.remoteAuth &&
    platformAuth.sessionUrl &&
    platformAuth.slug &&
    platformAuth.token
  ) {
    try {
      const platformRes = await fetch(platformAuth.sessionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: platformAuth.slug,
          token: platformAuth.token,
          email: localData.user,
        }),
      })
      const platformData = (await platformRes.json()) as { ok?: boolean; valid?: boolean }
      if (!platformRes.ok || !platformData.ok || !platformData.valid) {
        await logout()
        return { authenticated: false, user: null }
      }
    } catch {
      await logout()
      return { authenticated: false, user: null }
    }
  }

  return localData
}

export async function login(username: string, password: string): Promise<void> {
  const email = username.trim().toLowerCase()
  const platformAuth = await loadPlatformAuthConfig()

  if (
    platformAuth.remoteAuth &&
    platformAuth.loginUrl &&
    platformAuth.slug &&
    platformAuth.token
  ) {
    const platformRes = await fetch(platformAuth.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: platformAuth.slug,
        token: platformAuth.token,
        email,
        password,
      }),
    })

    const platformData = (await platformRes.json().catch(() => null)) as {
      ok?: boolean
      error?: string
      user?: string
      nonce?: string
      sig?: string
    } | null

    if (!platformRes.ok || !platformData?.ok || !platformData.nonce || !platformData.sig) {
      throw new Error(platformData?.error ?? 'E-mail ou senha inválidos')
    }

    const establishRes = await fetch(ENDPOINTS.establish, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: platformData.user ?? email,
        nonce: platformData.nonce,
        sig: platformData.sig,
      }),
    })

    if (!establishRes.ok) {
      const data = (await establishRes.json().catch(() => null)) as { error?: string } | null
      throw new Error(data?.error ?? 'Não foi possível iniciar a sessão do editor')
    }

    return
  }

  const res = await fetch(ENDPOINTS.login, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha no login')
  }
}

export async function logout(): Promise<void> {
  await fetch(ENDPOINTS.logout, { method: 'POST', credentials: 'include' })
}

export type EditorLoadResult = {
  config: BioConfig
  source: 'draft' | 'published' | 'none'
  hasDraft: boolean
}

export async function loadEditorConfig(): Promise<EditorLoadResult> {
  const res = await fetch(ENDPOINTS.load, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao carregar a bio')
  }
  const data = (await res.json()) as {
    config: BioConfig
    source: 'draft' | 'published' | 'none'
    hasDraft: boolean
  }
  return {
    config: data.config,
    source: data.source,
    hasDraft: Boolean(data.hasDraft),
  }
}

/** Salva apenas o rascunho (não atualiza a bio pública). */
export async function saveBioConfig(config: BioConfig): Promise<void> {
  const res = await fetch(ENDPOINTS.save, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao salvar rascunho')
  }
}

/** Salva o rascunho e publica na bio ao vivo. */
export async function publishBioConfig(config: BioConfig): Promise<void> {
  const res = await fetch(ENDPOINTS.publish, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao publicar')
  }
}

/** Substitui o rascunho pela bio publicada atualmente. */
export async function revertDraftToPublished(): Promise<BioConfig> {
  const res = await fetch(ENDPOINTS.revert, {
    method: 'POST',
    credentials: 'include',
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao reverter rascunho')
  }

  const data = (await res.json()) as { config: BioConfig }
  return data.config
}
