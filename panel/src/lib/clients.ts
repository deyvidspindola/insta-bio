import { validateSlug, normalizeSlug } from '@shared/lib/reservedSlugs'
import { ENDPOINTS } from './endpoints'

export type Client = {
  id: number
  slug: string
  name: string
  email: string
  status: 'active' | 'suspended' | 'pending'
  self_hosted: boolean | number
  allowed_host: string | null
  deploy_path: string | null
  created_at: string
  updated_at: string
}

export function deployPathLabel(path: string | null | undefined): string {
  if (!path) return '/'
  return path
}

export function deployPathToInput(path: string | null | undefined): string {
  if (path === null || path === undefined || path === '') return '/'
  return path
}

export type CreatedClient = Client & {
  password: string
  bio_url: string
  editor_url: string
  instagram_warning?: string | null
}

export async function listClients(): Promise<Client[]> {
  const res = await fetch(ENDPOINTS.clients, { credentials: 'include' })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível listar clientes')
  }
  const data = (await res.json()) as { clients: Client[] }
  return data.clients
}

export async function createClient(input: {
  name: string
  slug: string
  email: string
  password?: string
  instagramHandle?: string
  selfHosted?: boolean
  allowedHost?: string
  deployPath?: string
}): Promise<CreatedClient> {
  const slugError = validateSlug(input.slug)
  if (slugError) throw new Error(slugError)

  const res = await fetch(ENDPOINTS.createClient, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      slug: normalizeSlug(input.slug),
      email: input.email.trim().toLowerCase(),
      password: input.password?.trim() || undefined,
      instagram_handle: input.instagramHandle?.trim() || undefined,
      self_hosted: Boolean(input.selfHosted),
      allowed_host: input.selfHosted ? input.allowedHost?.trim() || undefined : undefined,
      deploy_path: input.selfHosted ? input.deployPath?.trim() || undefined : undefined,
    }),
  })

  const data = (await res.json().catch(() => null)) as {
    error?: string
    client?: CreatedClient
    instagram_warning?: string | null
  } | null

  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível criar o cliente')
  if (!data?.client) throw new Error('Resposta inválida do servidor')
  if (data.instagram_warning) {
    data.client.instagram_warning = data.instagram_warning
  }
  return data.client
}

export type UpdatedClient = Client & {
  slug_changed?: boolean
  bio_url: string
  editor_url: string
}

export async function updateClient(input: {
  id: number
  name: string
  slug: string
  email: string
  selfHosted?: boolean
  allowedHost?: string
  deployPath?: string
}): Promise<UpdatedClient> {
  const slugError = validateSlug(input.slug)
  if (slugError) throw new Error(slugError)

  const res = await fetch(ENDPOINTS.updateClient, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: input.id,
      name: input.name.trim(),
      slug: normalizeSlug(input.slug),
      email: input.email.trim().toLowerCase(),
      self_hosted: Boolean(input.selfHosted),
      allowed_host: input.selfHosted ? input.allowedHost?.trim() ?? '' : '',
      deploy_path: input.selfHosted ? input.deployPath?.trim() ?? '' : '',
    }),
  })

  const data = (await res.json().catch(() => null)) as {
    error?: string
    client?: UpdatedClient
  } | null

  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível atualizar o cliente')
  if (!data?.client) throw new Error('Resposta inválida do servidor')
  return data.client
}

export async function setClientStatus(id: number, status: 'active' | 'suspended'): Promise<void> {
  const res = await fetch(ENDPOINTS.clientStatus, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível atualizar o status')
  }
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(ENDPOINTS.deleteClient, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível excluir o cliente')
  }
}

export async function getClientPassword(
  id: number,
): Promise<{ password: string | null; note?: string }> {
  const res = await fetch(ENDPOINTS.clientPassword, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  const data = (await res.json().catch(() => null)) as {
    error?: string
    password?: string | null
    note?: string
  } | null
  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível consultar a senha')
  return { password: data?.password ?? null, note: data?.note }
}

export async function resetClientPassword(id: number, password?: string): Promise<string> {
  if (password && password.trim().length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres')
  }
  const res = await fetch(ENDPOINTS.resetPassword, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password: password?.trim() || undefined }),
  })
  const data = (await res.json().catch(() => null)) as {
    error?: string
    password?: string
  } | null
  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível redefinir a senha')
  if (!data?.password) throw new Error('Resposta inválida do servidor')
  return data.password
}

export function slugFromName(name: string): string {
  return normalizeSlug(name)
}

export function isSelfHostedClient(
  client: Pick<Client, 'self_hosted' | 'allowed_host'>,
): boolean {
  return Boolean(client.self_hosted) && Boolean(client.allowed_host?.trim())
}

function normalizeClientHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

function deployPathPrefix(path: string | null | undefined): string {
  if (!path) return '/'
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

export function clientBioUrl(
  client: Pick<Client, 'slug' | 'self_hosted' | 'allowed_host' | 'deploy_path'>,
  platformOrigin?: string,
): string {
  const origin = platformOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  if (isSelfHostedClient(client)) {
    const prefix = deployPathPrefix(client.deploy_path)
    return `https://${normalizeClientHost(client.allowed_host!)}${prefix}`
  }
  return `${origin}/${client.slug}/`
}

export function clientEditorUrl(
  client: Pick<Client, 'slug' | 'email' | 'self_hosted' | 'allowed_host' | 'deploy_path'>,
  platformOrigin?: string,
): string {
  const origin = platformOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const qs = new URLSearchParams({ user: client.email })
  if (isSelfHostedClient(client)) {
    const prefix = deployPathPrefix(client.deploy_path)
    const editorPath = prefix === '/' ? '/editor/' : `${prefix}editor/`
    return `https://${normalizeClientHost(client.allowed_host!)}${editorPath}?${qs.toString()}`
  }
  return `${origin}/${client.slug}/editor/?${qs.toString()}`
}

export function clientBioHref(slug: string): string {
  return `/${slug}/`
}

export function clientEditorHref(slug: string, email: string): string {
  const qs = new URLSearchParams({ user: email })
  return `/${slug}/editor/?${qs.toString()}`
}

export function downloadClientExport(id: number): void {
  window.location.assign(`${ENDPOINTS.exportClient}?id=${id}`)
}

export type SyncTemplateResult = {
  ok: boolean
  template_dir: string
  platform_root: string
  updated: { id: number; slug: string; name: string }[]
  skipped: { slug: string; reason: string }[]
  errors: { slug: string; error: string }[]
}

export async function syncAllClientsTemplate(): Promise<SyncTemplateResult> {
  const res = await fetch(ENDPOINTS.syncTemplate, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
  })

  const data = (await res.json()) as SyncTemplateResult & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Não foi possível atualizar os sites')
  }

  return data
}
