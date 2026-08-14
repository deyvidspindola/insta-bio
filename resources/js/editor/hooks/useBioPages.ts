import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BioSection } from '@bio-types'
import { api } from '../../shared/http'
import { ENDPOINTS } from '../lib/endpoints'

export type BioPageStatus = 'draft' | 'published' | string

export type BioPageRecord = {
  id: number
  slug: string
  title: string
  status: BioPageStatus
  json_draft: { sections?: BioSection[] } | null
  json_published: { sections?: BioSection[] } | null
  created_at?: string | null
  updated_at?: string | null
}

function pageUrl(slug: string): string {
  return `${ENDPOINTS.bioPages}/${encodeURIComponent(slug)}`
}

function publishUrl(slug: string): string {
  return `${pageUrl(slug)}/publish`
}

function sectionsFromDraft(page: BioPageRecord | null): BioSection[] {
  const draft = page?.json_draft
  if (!draft || !Array.isArray(draft.sections)) return []
  return structuredClone(draft.sections)
}

/**
 * Lista e edita páginas internas da bio (CRUD /api/bio/pages).
 * Mantém rascunho local das sections da página selecionada.
 */
export function useBioPages(enabled = true) {
  const [pages, setPages] = useState<BioPageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [draftSections, setDraftSections] = useState<BioSection[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedSlug) ?? null,
    [pages, selectedSlug],
  )

  const isDirty =
    selectedSlug !== null &&
    savedSnapshot !== null &&
    JSON.stringify(draftSections) !== savedSnapshot

  const loadPages = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await api<{ pages: BioPageRecord[] }>(ENDPOINTS.bioPages)
      setPages(data.pages ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar páginas')
      setPages([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void loadPages()
  }, [enabled, loadPages])

  function selectPage(slug: string | null) {
    if (slug === null) {
      setSelectedSlug(null)
      setDraftSections([])
      setSavedSnapshot(null)
      return
    }

    const page = pages.find((item) => item.slug === slug) ?? null
    const sections = sectionsFromDraft(page)
    setSelectedSlug(slug)
    setDraftSections(sections)
    setSavedSnapshot(JSON.stringify(sections))
  }

  function updateDraftSections(next: BioSection[] | ((prev: BioSection[]) => BioSection[])) {
    setDraftSections((prev) => (typeof next === 'function' ? next(prev) : next))
  }

  function applyServerPage(page: BioPageRecord) {
    const sections = sectionsFromDraft(page)
    setPages((prev) => prev.map((item) => (item.slug === page.slug ? page : item)))
    setDraftSections(sections)
    setSavedSnapshot(JSON.stringify(sections))
  }

  async function createPage(title: string): Promise<BioPageRecord> {
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Informe o título da página')

    const page = await api<BioPageRecord>(ENDPOINTS.bioPages, {
      method: 'POST',
      body: JSON.stringify({ title: trimmed }),
    })

    setPages((prev) => [page, ...prev.filter((item) => item.slug !== page.slug)])
    const sections = sectionsFromDraft(page)
    setSelectedSlug(page.slug)
    setDraftSections(sections)
    setSavedSnapshot(JSON.stringify(sections))
    return page
  }

  async function saveDraft(): Promise<BioPageRecord> {
    if (!selectedSlug) throw new Error('Nenhuma página selecionada')
    setSaving(true)
    setError(null)
    try {
      const page = await api<BioPageRecord>(pageUrl(selectedSlug), {
        method: 'PUT',
        body: JSON.stringify({ sections: draftSections }),
      })
      applyServerPage(page)
      return page
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar rascunho'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function publishPage(): Promise<BioPageRecord> {
    if (!selectedSlug) throw new Error('Nenhuma página selecionada')
    setPublishing(true)
    setError(null)
    try {
      // Garante que o rascunho local vai para o servidor antes de publicar.
      if (isDirty) {
        const saved = await api<BioPageRecord>(pageUrl(selectedSlug), {
          method: 'PUT',
          body: JSON.stringify({ sections: draftSections }),
        })
        applyServerPage(saved)
      }

      const page = await api<BioPageRecord>(publishUrl(selectedSlug), {
        method: 'POST',
        body: JSON.stringify({}),
      })
      applyServerPage(page)
      return page
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao publicar página'
      setError(message)
      throw err
    } finally {
      setPublishing(false)
    }
  }

  async function deletePage(slug: string): Promise<void> {
    setDeleting(true)
    setError(null)
    try {
      await api<{ ok: boolean }>(pageUrl(slug), { method: 'DELETE' })
      setPages((prev) => prev.filter((item) => item.slug !== slug))
      if (selectedSlug === slug) {
        setSelectedSlug(null)
        setDraftSections([])
        setSavedSnapshot(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir página'
      setError(message)
      throw err
    } finally {
      setDeleting(false)
    }
  }

  return {
    pages,
    loading,
    error,
    setError,
    selectedSlug,
    selectedPage,
    draftSections,
    isDirty,
    saving,
    publishing,
    deleting,
    loadPages,
    selectPage,
    updateDraftSections,
    createPage,
    saveDraft,
    publishPage,
    deletePage,
  }
}

export type UseBioPagesReturn = ReturnType<typeof useBioPages>
