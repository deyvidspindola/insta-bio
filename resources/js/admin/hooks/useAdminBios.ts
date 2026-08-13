import { useEffect, useState } from 'react'
import { adminApi, type BioRow } from '../application/adminApi'

/**
 * Lista, altera plano/status e impersona bios no admin.
 */
export function useAdminBios() {
  const [bios, setBios] = useState<BioRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load(query = q) {
    const data = await adminApi.list(query)
    setBios(data.bios)
  }

  useEffect(() => {
    void load('').catch((err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function patch(id: number, body: Record<string, string>) {
    await adminApi.patch(id, body)
    await load()
  }

  async function impersonate(id: number) {
    const data = await adminApi.impersonate(id)
    window.location.href = data.redirect
  }

  return { bios, q, setQ, error, load, patch, impersonate }
}
