import { FormEvent, useEffect, useState } from 'react'
import { settingsApi, type Billing, type DomainState } from '../application/settingsApi'

/**
 * Carrega e muta plano + domínio na tela de configurações.
 */
export function useSettings() {
  const [billing, setBilling] = useState<Billing | null>(null)
  const [domain, setDomain] = useState<DomainState | null>(null)
  const [host, setHost] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([settingsApi.billing(), settingsApi.domain()]).then(([bill, dom]) => {
      setBilling(bill)
      setDomain(dom)
      setHost(dom.domain?.domain ?? '')
    })
  }, [])

  async function upgrade() {
    setError(null)
    try {
      const data = await settingsApi.checkout()
      window.location.href = data.init_point
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o checkout')
    }
  }

  async function saveDomain(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const data = await settingsApi.saveDomain(host)
      setDomain((current) => ({
        allowed: current?.allowed ?? true,
        cname: data.cname,
        domain: data.domain,
      }))
      setMessage('Domínio salvo. Aponte o CNAME e clique em verificar.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar domínio')
    }
  }

  async function verify() {
    setError(null)
    try {
      const data = await settingsApi.verifyDomain()
      setDomain((current) => (current ? { ...current, domain: data.domain } : current))
      setMessage(data.ok ? 'Domínio verificado.' : data.error ?? 'Ainda não verificado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na verificação')
    }
  }

  return { billing, domain, host, setHost, message, error, upgrade, saveDomain, verify }
}
