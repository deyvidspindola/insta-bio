import { api } from '../../shared/http'

export type Billing = {
  plan: string
  price: number
  configured: boolean
  limits: { max_links: number | null; custom_domain: boolean; watermark: boolean }
}

export type DomainState = {
  allowed: boolean
  cname: string
  domain: { domain: string; verified_at: string | null; verification_token: string } | null
}

/**
 * Chamadas HTTP de plano e domínio próprio.
 */
export const settingsApi = {
  billing: () => api<Billing>('/api/billing'),
  domain: () => api<DomainState>('/api/domain'),
  checkout: () => api<{ init_point: string }>('/api/billing/checkout', { method: 'POST' }),
  saveDomain: (host: string) =>
    api<{ domain: DomainState['domain']; txt: string; cname: string }>('/api/domain', {
      method: 'POST',
      body: JSON.stringify({ domain: host }),
    }),
  verifyDomain: () =>
    api<{ ok: boolean; error?: string; domain: DomainState['domain'] }>('/api/domain/verify', {
      method: 'POST',
    }),
}
