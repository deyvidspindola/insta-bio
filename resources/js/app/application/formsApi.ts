import { api } from '../../shared/http'

export type FormSubmissionItem = {
  id: number
  form_slug?: string | null
  section_id: string
  item_index: number
  form_title: string | null
  answers: Record<string, string>
  created_at: string | null
}

export type FormFilterOption = {
  form_slug: string | null
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
  list: (filter?: { formSlug?: string | null; sectionId?: string | null; itemIndex?: number | null }) => {
    const params = new URLSearchParams()
    if (filter?.formSlug) params.set('form_slug', filter.formSlug)
    if (filter?.sectionId) params.set('section_id', filter.sectionId)
    if (typeof filter?.itemIndex === 'number') params.set('item_index', String(filter.itemIndex))
    const qs = params.toString()
    return api<FormSubmissionsResponse>(`/api/forms/submissions${qs ? `?${qs}` : ''}`)
  },
}
