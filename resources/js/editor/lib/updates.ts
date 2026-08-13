import { ENDPOINTS } from './endpoints'

export type UpdateState = {
  version: string
  updatedAt: string | null
  channel?: string
  previousVersion?: string | null
}

export type UpdateStatusResponse = {
  ok: boolean
  state: UpdateState
  platformManaged: boolean
}

export async function fetchUpdateStatus(): Promise<UpdateStatusResponse> {
  const res = await fetch(ENDPOINTS.updateStatus, {
    credentials: 'include',
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => null)) as
    | (UpdateStatusResponse & { error?: string })
    | null
  if (!res.ok) {
    throw new Error(data?.error ?? 'Não foi possível carregar a versão')
  }
  if (!data?.ok) {
    throw new Error(data?.error ?? 'Resposta inválida')
  }
  return data
}

/**
 * Fase C — verifica remotamente se há uma nova versão disponível.
 * Chama o endpoint updateCheck (PHP) que consulta a API da plataforma.
 */
export async function checkForUpdates(): Promise<{
  ok: boolean
  updateAvailable: boolean
  installed: string
  latest: string
  changelog?: string
  releasedAt?: string
}> {
  const res = await fetch(ENDPOINTS.updateCheck, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    updateAvailable?: boolean
    installed?: string
    latest?: string
    changelog?: string
    releasedAt?: string
  } | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Falha ao buscar atualizações')
  }

  return {
    ok: true,
    updateAvailable: Boolean(data.updateAvailable),
    installed: data.installed ?? '0.0.0',
    latest: data.latest ?? '',
    changelog: data.changelog,
    releasedAt: data.releasedAt,
  }
}

/**
 * Fase D — aplica a atualização disponível.
 * Chama o endpoint updateApply (PHP) que baixa, valida, faz backup e substitui arquivos.
 */
export async function applyUpdate(): Promise<{
  ok: boolean
  version: string
  updatedAt: string
}> {
  const res = await fetch(ENDPOINTS.updateApply, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    version?: string
    updatedAt?: string
  } | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Falha ao aplicar atualização')
  }

  return {
    ok: true,
    version: data.version ?? 'desconhecida',
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}