import { api } from '../../shared/http'

export type LeadStage = 'novo' | 'contatado' | 'negociando' | 'fechado' | 'perdido'

export type LeadItem = {
  id: number
  name: string | null
  contact: string | null
  source_type: string
  source_label: string | null
  stage: LeadStage | string
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type LeadsResponse = {
  items: LeadItem[]
  stages: LeadStage[]
}

/**
 * API do funil de prospects.
 */
export const leadsApi = {
  list: () => api<LeadsResponse>('/api/leads'),
  updateStage: (id: number, stage: string) =>
    api<LeadItem>(`/api/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),
  updateNotes: (id: number, notes: string | null) =>
    api<LeadItem>(`/api/leads/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),
  remove: (id: number) =>
    api<{ ok: boolean }>(`/api/leads/${id}`, { method: 'DELETE' }),
}
