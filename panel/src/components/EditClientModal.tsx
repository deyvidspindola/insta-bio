import { useEffect, useState } from 'react'
import { validateSlug, normalizeSlug } from '@shared/lib/reservedSlugs'
import { deployPathToInput, updateClient, type Client } from '../lib/clients'

type Props = {
  client: Client | null
  onClose: () => void
  onUpdated: () => void
}

export function EditClientModal({ client, onClose, onUpdated }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [selfHosted, setSelfHosted] = useState(false)
  const [allowedHost, setAllowedHost] = useState('')
  const [deployPath, setDeployPath] = useState('/')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!client) return
    setName(client.name)
    setSlug(client.slug)
    setEmail(client.email)
    setSelfHosted(Boolean(client.self_hosted))
    setAllowedHost(client.allowed_host ?? '')
    setDeployPath(deployPathToInput(client.deploy_path))
    setError(null)
  }, [client])

  if (!client) return null

  const slugPreview = normalizeSlug(slug)
  const slugError = slugPreview ? validateSlug(slugPreview) : null
  const slugChanged = slugPreview !== client.slug
  const hostingError = selfHosted
    ? !allowedHost.trim()
      ? 'Informe o domínio autorizado'
      : !deployPath.trim()
        ? 'Informe a pasta no domínio'
        : null
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await updateClient({
        id: client.id,
        name,
        slug,
        email,
        selfHosted,
        allowedHost: selfHosted ? allowedHost : undefined,
        deployPath: selfHosted ? deployPath : undefined,
      })
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
          Altere nome, e-mail, slug ou configuração de hospedagem.
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
            <label htmlFor="edit-client-slug">Slug (URL na plataforma)</label>
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
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={selfHosted}
                onChange={(e) => setSelfHosted(e.target.checked)}
              />
              <span>
                <span className="font-medium">Hospedagem própria</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Ative para permitir exportar ZIP e rodar em domínio do cliente.
                </span>
              </span>
            </label>
          </div>

          {selfHosted && (
            <>
              <div className="field mb-0">
                <label htmlFor="edit-client-allowed-host">Domínio autorizado</label>
                <input
                  id="edit-client-allowed-host"
                  value={allowedHost}
                  onChange={(e) => setAllowedHost(e.target.value)}
                  placeholder="cliente.com.br"
                  required={selfHosted}
                />
              </div>

              <div className="field mb-0">
                <label htmlFor="edit-client-deploy-path">Pasta no domínio</label>
                <input
                  id="edit-client-deploy-path"
                  value={deployPath}
                  onChange={(e) => setDeployPath(e.target.value)}
                  placeholder="/ ou links"
                  required={selfHosted}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Caminho onde o ZIP será extraído. Use <code className="text-xs">/</code> para raiz.
                </p>
              </div>
            </>
          )}

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

          {hostingError && <p className="text-sm text-red-400">{hostingError}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Boolean(slugError) || Boolean(hostingError)}
            >
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
