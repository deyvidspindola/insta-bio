import { api } from '../../shared/http'

export type BioRow = {
  id: number
  slug: string
  plan: string
  status: string
  name: string | null
  email: string | null
  url: string
}

/**
 * Chamadas HTTP do painel admin.
 */
export const adminApi = {
  list: (query: string) => api<{ bios: BioRow[] }>(`/api/admin/bios?q=${encodeURIComponent(query)}`),
  patch: (id: number, body: Record<string, string>) =>
    api(`/api/admin/bios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  impersonate: (id: number) =>
    api<{ redirect: string }>(`/api/admin/bios/${id}/impersonate`, { method: 'POST' }),
}
