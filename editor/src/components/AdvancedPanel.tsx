import { useEffect, useState } from 'react'
import { Copy, Download, RotateCcw, Save, Undo2, Upload } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { fetchEditorPaths, saveEditorPaths, type EditorPathsInfo } from '../lib/paths'
import { setBioJsonRelativePath } from '@site/lib/publicUrl'
import { ConfirmDialog } from './ConfirmDialog'
import { JsonPanel } from './JsonPanel'
import { UpdatesCard } from './UpdatesCard'


interface AdvancedPanelProps {
  config: BioConfig
  onImport: (file: File) => void
  onCopy: () => void
  onDownload: () => void
  onRestoreDefault: () => void
  onRevertToPublished: () => Promise<void> | void
  onPathsSaved?: () => Promise<void> | void
  reverting?: boolean
}

export function AdvancedPanel({
  config,
  onImport,
  onCopy,
  onDownload,
  onRestoreDefault,
  onRevertToPublished,
  onPathsSaved,
  reverting = false,
}: AdvancedPanelProps) {
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [confirmRevert, setConfirmRevert] = useState(false)
  const [paths, setPaths] = useState<EditorPathsInfo | null>(null)
  const [bioPathInput, setBioPathInput] = useState('')
  const [pathsLoading, setPathsLoading] = useState(true)
  const [pathsSaving, setPathsSaving] = useState(false)
  const [pathsError, setPathsError] = useState<string | null>(null)
  const [pathsStatus, setPathsStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPathsLoading(true)
    setPathsError(null)
    void fetchEditorPaths()
      .then((info) => {
        if (cancelled) return
        setPaths(info)
        setBioPathInput(info.bioJsonPath)
      })
      .catch((err) => {
        if (cancelled) return
        setPathsError(err instanceof Error ? err.message : 'Erro ao carregar caminhos')
      })
      .finally(() => {
        if (!cancelled) setPathsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSavePaths() {
    setPathsSaving(true)
    setPathsError(null)
    setPathsStatus(null)
    try {
      const updated = await saveEditorPaths(bioPathInput)
      setPaths(updated)
      setBioPathInput(updated.bioJsonPath)
      if (updated.publicBioUrl) {
        setBioJsonRelativePath(updated.publicBioUrl)
      }
      setPathsStatus('Caminho salvo. Recarregue a página para aplicar nas próximas operações.')
      await onPathsSaved?.()
    } catch (err) {
      setPathsError(err instanceof Error ? err.message : 'Erro ao salvar caminho')
    } finally {
      setPathsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <UpdatesCard />

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Caminho do bio.json</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Onde o editor lê e grava a bio publicada. A bio pública do site usa o arquivo{' '}
          <code className="text-xs">bio-path.json</code> gerado automaticamente ao salvar.
        </p>

        {pathsLoading ? (
          <p className="text-xs text-muted-foreground">Carregando caminhos…</p>
        ) : (
          <div className="space-y-3">
            <div className="field mb-0">
              <label htmlFor="bio-json-path">Arquivo bio.json</label>
              <input
                id="bio-json-path"
                value={bioPathInput}
                onChange={(e) => setBioPathInput(e.target.value)}
                placeholder="/caminho/para/bio.json"
                spellCheck={false}
              />
            </div>

            {paths && (
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <p>
                  <span className="text-foreground">Bio pública (relativo):</span>{' '}
                  {paths.publicBioUrl ?? '—'}
                </p>
                <p className="mt-1">
                  <span className="text-foreground">Rascunho:</span> {paths.draftPath}
                </p>
                <p className="mt-1">
                  <span className="text-foreground">Assets:</span> {paths.assetsDir}
                </p>
                <p className="mt-1">
                  <span className="text-foreground">Config:</span> {paths.configFile}
                </p>
                <p className="mt-1">
                  {paths.bioExists ? 'bio.json encontrado' : 'bio.json ainda não existe'} ·{' '}
                  {paths.writable ? 'pasta gravável' : 'sem permissão de escrita'}
                </p>
              </div>
            )}

            {pathsError && <p className="text-xs text-red-400">{pathsError}</p>}
            {pathsStatus && <p className="text-xs text-emerald-400">{pathsStatus}</p>}

            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
              disabled={pathsSaving || bioPathInput.trim() === ''}
              onClick={() => void handleSavePaths()}
            >
              {pathsSaving ? (
                'Salvando…'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar caminho
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Arquivo da bio</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Importar, exportar ou copiar o JSON. Importar altera só o editor — use Salvar/Publicar
          depois.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-xs">
            <Upload className="h-4 w-4" />
            Importar JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImport(file)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            onClick={onCopy}
          >
            <Copy className="h-4 w-4" />
            Copiar JSON
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            Baixar bio.json
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Rascunho</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Descarta as edições salvas no rascunho e volta para o que está publicado na bio pública.
          A bio ao vivo não muda.
        </p>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
          disabled={reverting}
          onClick={() => setConfirmRevert(true)}
        >
          <Undo2 className="h-4 w-4" />
          {reverting ? 'Revertendo…' : 'Reverter para a bio publicada'}
        </button>
      </div>

      <div className="card border-red-500/20">
        <h3 className="mb-1 text-sm font-semibold text-red-400">Zona de risco</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Restaura a bio ao modelo inicial (sem seções). O nome do cliente é mantido. Todas as seções
          e personalizações serão perdidas.
        </p>
        <button
          type="button"
          className="btn-danger inline-flex items-center gap-2 px-3 py-2 text-xs"
          onClick={() => setConfirmRestore(true)}
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar modelo padrão
        </button>
      </div>

      <JsonPanel config={config} />

      <ConfirmDialog
        open={confirmRevert}
        title="Reverter para a bio publicada?"
        description="O rascunho atual será substituído pelo conteúdo que está no ar. Alterações não publicadas serão perdidas."
        confirmLabel="Reverter"
        variant="danger"
        loading={reverting}
        onCancel={() => setConfirmRevert(false)}
        onConfirm={async () => {
          try {
            await onRevertToPublished()
            setConfirmRevert(false)
          } catch {
            // erro exibido pelo EditorApp; mantém o diálogo aberto
          }
        }}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restaurar modelo padrão?"
        description="Isso substitui toda a configuração atual pelo template inicial. Não é possível desfazer após salvar."
        confirmLabel="Restaurar"
        variant="danger"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          onRestoreDefault()
          setConfirmRestore(false)
        }}
      />
    </div>
  )
}
