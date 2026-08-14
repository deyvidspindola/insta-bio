import { api } from '../../shared/http'

export type FormSubmissionItem = {
  id: number
  section_id: string
  item_index: number
  form_title: string | null
  answers: Record<string, string>
  created_at: string | null
}

export type FormFilterOption = {
  section_id: string
  item_index: number
  form_title: string | null
}

export type FormSubmissionsResponse = {
  items: FormSubmissionItem[]
  forms: FormFilterOption[]
}

/**
 * API de respostas de formulários para o dono da bio.
 */
export const formsApi = {
  list: (sectionId?: string | null, itemIndex?: number | null) => {
    const params = new URLSearchParams()
    if (sectionId) params.set('section_id', sectionId)
    if (typeof itemIndex === 'number') params.set('item_index', String(itemIndex))
    const qs = params.toString()
    return api<FormSubmissionsResponse>(`/api/forms/submissions${qs ? `?${qs}` : ''}`)
  },
}
