import { useEffect, useState } from 'react'
import { validateSlug, normalizeSlug } from '@shared/lib/reservedSlugs'
import { updateClient, type Client } from '../lib/clients'

type Props = {
  client: Client | null
  onClose: () => void
  onUpdated: () => void
}

export function EditClientModal({ client, onClose, onUpdated }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!client) return
    setName(client.name)
    setSlug(client.slug)
    setEmail(client.email)
    setError(null)
  }, [client])

  if (!client) return null

  const slugPreview = normalizeSlug(slug)
  const slugError = slugPreview ? validateSlug(slugPreview) : null
  const slugChanged = slugPreview !== client.slug

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await updateClient({ id: client.id, name, slug, email })
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal-panel">
        <h2 className="text-lg font-semibold">Editar cliente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Altere nome, e-mail ou slug. A URL pública muda junto com o slug.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="field mb-0">
            <label htmlFor="edit-client-name">Nome</label>
            <input
              id="edit-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field mb-0">
            <label htmlFor="edit-client-slug">Slug (URL)</label>
            <input
              id="edit-client-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            {slugError && <p className="mt-1 text-xs text-red-400">{slugError}</p>}
            {slugChanged && !slugError && (
              <p className="mt-1 text-xs text-amber-400">
                A pasta será renomeada de <code>/{client.slug}/</code> para{' '}
                <code>/{slugPreview}/</code>. Links antigos deixam de funcionar.
              </p>
            )}
          </div>

          <div className="field mb-0">
            <label htmlFor="edit-client-email">E-mail (login do editor)</label>
            <input
              id="edit-client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Boolean(slugError)}
            >
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
