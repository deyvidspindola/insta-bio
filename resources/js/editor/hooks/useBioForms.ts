import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormField } from '@bio-types'
import { api } from '../../shared/http'
import { ENDPOINTS } from '../lib/endpoints'

export type BioFormStatus = 'draft' | 'published' | string

/** Conteúdo do rascunho (json_draft). */
export type BioFormDraft = {
  description: string
  fields: FormField[]
  submitLabel: string
  successMessage: string
}

export type BioFormRecord = {
  id: number
  slug: string
  title: string
  status: BioFormStatus
  json_draft: BioFormDraft | null
  json_published: BioFormDraft | null
  created_at?: string | null
  updated_at?: string | null
}

/** Estado editável local: title é coluna; o resto espelha json_draft. */
type EditorDraft = BioFormDraft & { title: string }

const EMPTY_DRAFT: EditorDraft = {
  title: '',
  description: '',
  fields: [],
  submitLabel: 'Enviar',
  successMessage: 'Recebemos sua mensagem. Obrigado!',
}

function formUrl(slug: string): string {
  return `${ENDPOINTS.bioForms}/${encodeURIComponent(slug)}`
}

function publishUrl(slug: string): string {
  return `${formUrl(slug)}/publish`
}

function draftFromRecord(form: BioFormRecord | null): EditorDraft {
  if (!form) return structuredClone(EMPTY_DRAFT)
  const raw = form.json_draft
  const fields = Array.isArray(raw?.fields) ? structuredClone(raw.fields) : []
  return {
    title: form.title ?? '',
    description: typeof raw?.description === 'string' ? raw.description : '',
    fields,
    submitLabel:
      typeof raw?.submitLabel === 'string' && raw.submitLabel.trim() !== ''
        ? raw.submitLabel
        : 'Enviar',
    successMessage:
      typeof raw?.successMessage === 'string' && raw.successMessage.trim() !== ''
        ? raw.successMessage
        : 'Recebemos sua mensagem. Obrigado!',
  }
}

function snapshotOf(draft: EditorDraft): string {
  return JSON.stringify(draft)
}

/**
 * Lista e edita formulários reutilizáveis da bio (CRUD /api/bio/forms).
 * Mantém rascunho local do formulário selecionado.
 */
export function useBioForms(enabled = true) {
  const [forms, setForms] = useState<BioFormRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditorDraft>(structuredClone(EMPTY_DRAFT))
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectedForm = useMemo(
    () => forms.find((form) => form.slug === selectedSlug) ?? null,
    [forms, selectedSlug],
  )

  const isDirty =
    selectedSlug !== null &&
    savedSnapshot !== null &&
    snapshotOf(draft) !== savedSnapshot

  const loadForms = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await api<{ forms: BioFormRecord[] }>(ENDPOINTS.bioForms)
      setForms(data.forms ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar formulários')
      setForms([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void loadForms()
  }, [enabled, loadForms])

  function selectForm(slug: string | null) {
    if (slug === null) {
      setSelectedSlug(null)
      setDraft(structuredClone(EMPTY_DRAFT))
      setSavedSnapshot(null)
      return
    }

    const form = forms.find((item) => item.slug === slug) ?? null
    const next = draftFromRecord(form)
    setSelectedSlug(slug)
    setDraft(next)
    setSavedSnapshot(snapshotOf(next))
  }

  function updateDraft(
    next: Partial<EditorDraft> | ((prev: EditorDraft) => EditorDraft),
  ) {
    setDraft((prev) => {
      if (typeof next === 'function') return next(prev)
      return { ...prev, ...next }
    })
  }

  function applyServerForm(form: BioFormRecord) {
    const next = draftFromRecord(form)
    setForms((prev) => prev.map((item) => (item.slug === form.slug ? form : item)))
    setDraft(next)
    setSavedSnapshot(snapshotOf(next))
  }

  async function createForm(title: string): Promise<BioFormRecord> {
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Informe o título do formulário')

    const form = await api<BioFormRecord>(ENDPOINTS.bioForms, {
      method: 'POST',
      body: JSON.stringify({ title: trimmed }),
    })

    setForms((prev) => [form, ...prev.filter((item) => item.slug !== form.slug)])
    const next = draftFromRecord(form)
    setSelectedSlug(form.slug)
    setDraft(next)
    setSavedSnapshot(snapshotOf(next))
    return form
  }

  function draftPayload(from: EditorDraft) {
    return {
      title: from.title.trim(),
      description: from.description,
      fields: from.fields,
      submitLabel: from.submitLabel,
      successMessage: from.successMessage,
    }
  }

  async function saveDraft(): Promise<BioFormRecord> {
    if (!selectedSlug) throw new Error('Nenhum formulário selecionado')
    setSaving(true)
    setError(null)
    try {
      const form = await api<BioFormRecord>(formUrl(selectedSlug), {
        method: 'PUT',
        body: JSON.stringify(draftPayload(draft)),
      })
      applyServerForm(form)
      return form
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar rascunho'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function publishForm(): Promise<BioFormRecord> {
    if (!selectedSlug) throw new Error('Nenhum formulário selecionado')
    setPublishing(true)
    setError(null)
    try {
      if (isDirty) {
        const saved = await api<BioFormRecord>(formUrl(selectedSlug), {
          method: 'PUT',
          body: JSON.stringify(draftPayload(draft)),
        })
        applyServerForm(saved)
      }

      const form = await api<BioFormRecord>(publishUrl(selectedSlug), {
        method: 'POST',
        body: JSON.stringify({}),
      })
      applyServerForm(form)
      return form
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao publicar formulário'
      setError(message)
      throw err
    } finally {
      setPublishing(false)
    }
  }

  async function deleteForm(slug: string): Promise<void> {
    setDeleting(true)
    setError(null)
    try {
      await api<{ ok: boolean }>(formUrl(slug), { method: 'DELETE' })
      setForms((prev) => prev.filter((item) => item.slug !== slug))
      if (selectedSlug === slug) {
        setSelectedSlug(null)
        setDraft(structuredClone(EMPTY_DRAFT))
        setSavedSnapshot(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir formulário'
      setError(message)
      throw err
    } finally {
      setDeleting(false)
    }
  }

  return {
    forms,
    loading,
    error,
    setError,
    selectedSlug,
    selectedForm,
    draft,
    isDirty,
    saving,
    publishing,
    deleting,
    loadForms,
    selectForm,
    updateDraft,
    createForm,
    saveDraft,
    publishForm,
    deleteForm,
  }
}

export type UseBioFormsReturn = ReturnType<typeof useBioForms>
