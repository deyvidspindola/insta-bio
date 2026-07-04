import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw, X } from 'lucide-react'
import type { Client } from '../lib/clients'
import { getClientPassword, resetClientPassword } from '../lib/clients'
import { generatePassword } from '../lib/password'

type Props = {
  client: Client | null
  onClose: () => void
}

export function PasswordModal({ client, onClose }: Props) {
  const [password, setPassword] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!client) return
    setPassword(null)
    setNote(null)
    setError(null)
    setShow(false)
    setCopied(false)
    setConfirmReset(false)
    setLoading(true)
    getClientPassword(client.id)
      .then((res) => {
        setPassword(res.password)
        setNote(res.note ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao consultar senha'))
      .finally(() => setLoading(false))
  }, [client])

  if (!client) return null

  async function handleReset() {
    if (!client) return
    setLoading(true)
    setError(null)
    try {
      const newPassword = await resetClientPassword(client.id, generatePassword())
      setPassword(newPassword)
      setNote(null)
      setShow(true)
      setConfirmReset(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!password) return
    void navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Senha do editor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {client.name} · <span className="text-xs">{client.email}</span>
            </p>
          </div>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {loading && !password ? (
          <div className="mt-4 flex items-center justify-center py-8 text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {password ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Senha atual</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-sm">
                    {show ? password : '•'.repeat(password.length)}
                  </code>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2 py-1.5"
                    onClick={() => setShow((v) => !v)}
                    title={show ? 'Ocultar' : 'Mostrar'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2 py-1.5"
                    onClick={handleCopy}
                    title="Copiar senha"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
                {note ?? 'Senha não disponível para este cliente.'}
              </div>
            )}

            {confirmReset ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm">
                  Gerar uma nova senha? A senha atual deixará de funcionar imediatamente.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmReset(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void handleReset()}
                    disabled={loading}
                  >
                    {loading ? 'Gerando…' : 'Gerar nova senha'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-2"
                onClick={() => setConfirmReset(true)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                Redefinir senha
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
