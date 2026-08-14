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
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void Promise.all([settingsApi.billing(), settingsApi.domain()]).then(([bill, dom]) => {
      setBilling(bill)
      setDomain(dom)
      setHost(dom.domain?.domain ?? '')
    })
  }, [])

  async function upgrade() {
    setError(null)
    setPending(true)
    try {
      const data = await settingsApi.checkout()
      if (data.driver === 'local') {
        setSandboxOpen(true)
        return
      }
      window.location.href = data.init_point
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o checkout')
    } finally {
      setPending(false)
    }
  }

  async function sandbox(action: 'approve' | 'reject') {
    setError(null)
    setPending(true)
    try {
      const result = await settingsApi.sandbox(action)
      const bill = await settingsApi.billing()
      setBilling(bill)
      setSandboxOpen(false)
      setMessage(
        action === 'approve'
          ? `Pagamento sandbox aprovado. Plano atual: ${result.plan === 'pro' ? 'Pro' : 'Free'}.`
          : 'Pagamento sandbox recusado. O plano continua Free.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no sandbox')
    } finally {
      setPending(false)
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

  return {
    billing,
    domain,
    host,
    setHost,
    message,
    error,
    sandboxOpen,
    pending,
    upgrade,
    sandbox,
    closeSandbox: () => setSandboxOpen(false),
    saveDomain,
    verify,
  }
}
