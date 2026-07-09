import type { BioConfig } from '@bio-types'
import { ENDPOINTS } from './endpoints'

export type SessionState = {
  authenticated: boolean
  user: string | null
}

export async function fetchSession(): Promise<SessionState> {
  const res = await fetch(ENDPOINTS.session, { credentials: 'include' })
  if (!res.ok) return { authenticated: false, user: null }
  return res.json()
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(ENDPOINTS.login, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha no login')
  }
}

export async function logout(): Promise<void> {
  await fetch(ENDPOINTS.logout, { method: 'POST', credentials: 'include' })
}

export async function saveBioConfig(config: BioConfig): Promise<void> {
  const res = await fetch(ENDPOINTS.save, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Falha ao salvar')
  }
}
