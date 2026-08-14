import { useCallback, useEffect, useState } from 'react'
import {
  formsApi,
  type FormFilterOption,
  type FormSubmissionItem,
} from '../application/formsApi'

/**
 * Carrega e filtra respostas de formulários da bio.
 */
export function useFormSubmissions() {
  const [items, setItems] = useState<FormSubmissionItem[]>([])
  const [forms, setForms] = useState<FormFilterOption[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextFilter = filter) => {
    setLoading(true)
    setError(null)
    try {
      let sectionId: string | null = null
      let itemIndex: number | null = null
      if (nextFilter !== 'all') {
        const [section, index] = nextFilter.split(':')
        sectionId = section || null
        itemIndex = index !== undefined && index !== '' ? Number(index) : null
      }
      const data = await formsApi.list(sectionId, itemIndex)
      setItems(data.items)
      setForms(data.forms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar respostas')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  function changeFilter(value: string) {
    setFilter(value)
  }

  return { items, forms, filter, changeFilter, loading, error, reload: () => void load(filter) }
}
