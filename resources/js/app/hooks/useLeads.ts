import { useCallback, useEffect, useState } from 'react'
import { leadsApi, type LeadItem } from '../application/leadsApi'

/**
 * Carrega leads e expõe ações do funil.
 */
export function useLeads() {
  const [items, setItems] = useState<LeadItem[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await leadsApi.list()
      setItems(data.items)
      setStages(data.stages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function moveStage(id: number, stage: string) {
    setPendingId(id)
    setError(null)
    try {
      const updated = await leadsApi.updateStage(id, stage)
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao mover estágio')
    } finally {
      setPendingId(null)
    }
  }

  async function saveNotes(id: number, notes: string) {
    setPendingId(id)
    setError(null)
    try {
      const updated = await leadsApi.updateNotes(id, notes.trim() || null)
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar nota')
    } finally {
      setPendingId(null)
    }
  }

  async function remove(id: number) {
    setPendingId(id)
    setError(null)
    try {
      await leadsApi.remove(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir lead')
    } finally {
      setPendingId(null)
    }
  }

  return { items, stages, loading, error, pendingId, moveStage, saveNotes, remove, reload: load }
}
