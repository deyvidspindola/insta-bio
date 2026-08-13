import type { BioConfig } from '@bio-types'
import { csrfHeaders } from '../../shared/http'
import { ENDPOINTS } from './endpoints'

export type SessionState = {
  authenticated: boolean
  user: string | null
  slug?: string | null
  plan?: string | null
}

export async function fetchSession(): Promise<SessionState> {
  const res = await fetch(ENDPOINTS.session, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return { authenticated: false, user: null }
  return (await res.json()) as SessionState
}

export async function login(_username: string, _password: string): Promise<void> {
  window.location.href = '/login'
}

export async function logout(): Promise<void> {
  await fetch(ENDPOINTS.logout, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
  })
  window.location.href = '/login'
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
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao carregar a bio')
  }
  const data = (await res.json()) as EditorLoadResult
  return {
    config: data.config,
    source: data.source,
    hasDraft: Boolean(data.hasDraft),
  }
}

export async function saveBioConfig(config: BioConfig): Promise<void> {
  const res = await fetch(ENDPOINTS.save, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao salvar rascunho')
  }
}

export async function publishBioConfig(config: BioConfig): Promise<void> {
  const res = await fetch(ENDPOINTS.publish, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao publicar')
  }
}

export async function revertDraftToPublished(): Promise<BioConfig> {
  const res = await fetch(ENDPOINTS.revert, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao reverter rascunho')
  }
  const data = (await res.json()) as { config: BioConfig }
  return data.config
}

export async function restoreBioBackup(): Promise<BioConfig> {
  const res = await fetch(ENDPOINTS.restoreBackup, {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao restaurar backup')
  }
  const data = (await res.json()) as { config: BioConfig }
  return data.config
}
