import { useEffect, useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import {
  fetchUpdateStatus,
  checkForUpdates,
  applyUpdate,
  type UpdateState,
} from '../lib/updates'

/**
 * Card "Atualizações" — disponível para todos os clientes (plataforma e self-hosted).
 * Fonte única: pacote ZIP na API da plataforma.
 */
function formatDate(value: string | null | undefined): string {
  if (!value) return 'nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'nunca'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UpdatesCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<UpdateState | null>(null)
  const [platformManaged, setPlatformManaged] = useState(false)

  const [checking, setChecking] = useState(false)
  const [applying, setApplying] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [changelog, setChangelog] = useState<string | null>(null)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchUpdateStatus()
        if (cancelled) return
        setState(data.state)
        setPlatformManaged(data.platformManaged)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar a versão')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCheck() {
    setChecking(true)
    setCheckError(null)
    setCheckMessage(null)
    setUpdateAvailable(false)
    setLatestVersion(null)
    setChangelog(null)

    try {
      const data = await checkForUpdates()
      if (data.updateAvailable) {
        setUpdateAvailable(true)
        setLatestVersion(data.latest)
        setChangelog(data.changelog ?? 'Sem detalhes do changelog.')
        setCheckMessage(`Nova versão ${data.latest} disponível!`)
      } else {
        setCheckMessage('Você está na versão mais recente.')
      }
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Erro ao verificar atualizações')
    } finally {
      setChecking(false)
    }
  }

  async function handleApply() {
    setApplying(true)
    setCheckError(null)
    setCheckMessage(null)
    try {
      const result = await applyUpdate()
      setState((prev) =>
        prev ? { ...prev, version: result.version, updatedAt: result.updatedAt } : null,
      )
      setCheckMessage(`Atualização concluída! Versão ${result.version}`)
      setUpdateAvailable(false)
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Erro ao aplicar atualização')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="card">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Atualizações
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Versão do template neste site.
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">Versão:</span> {state?.version ?? 'desconhecida'}
            </p>
            <p className="mt-1">
              <span className="text-foreground">Última atualização:</span>{' '}
              {formatDate(state?.updatedAt)}
            </p>
          </div>

          {platformManaged && (
            <p className="text-xs text-muted-foreground">
              Cliente da plataforma: você pode atualizar aqui ou o admin pode atualizar todos pelo
              painel.
            </p>
          )}

          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            onClick={() => void handleCheck()}
            disabled={checking || applying}
          >
            {checking ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3 w-3" aria-hidden />
            )}
            {checking ? 'Verificando…' : 'Buscar atualizações'}
          </button>

          {checkError && <p className="text-xs text-red-400">{checkError}</p>}
          {checkMessage && !checkError && (
            <p className="text-xs text-emerald-400">{checkMessage}</p>
          )}

          {updateAvailable && latestVersion && (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <p className="font-medium text-foreground">Versão {latestVersion} disponível</p>
              {changelog ? (
                <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{changelog}</div>
              ) : null}
              <button
                type="button"
                className="btn-primary mt-2 inline-flex items-center gap-2 px-3 py-2 text-xs"
                onClick={() => void handleApply()}
                disabled={applying}
              >
                {applying ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                {applying ? 'Aplicando…' : 'Atualizar agora'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
