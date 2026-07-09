import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, RefreshCw, Trash2, Upload } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { deleteAsset, formatFileSize, listAssets, type AssetFile } from '../lib/assets'
import { ENDPOINTS } from '../lib/endpoints'
import { collectUsedAssetFilenames, isAssetInUse } from '../lib/imageUsage'
import { ConfirmDialog } from './ConfirmDialog'

type Filter = 'all' | 'used' | 'unused'

interface ImagesGalleryProps {
  config: BioConfig
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImagesGallery({ config }: ImagesGalleryProps) {
  const [files, setFiles] = useState<AssetFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AssetFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const usedFilenames = useMemo(() => collectUsedAssetFilenames(config), [config])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFiles(await listAssets())
    } catch {
      setError('Não foi possível carregar as imagens.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return files.filter((file) => {
      const inUse = usedFilenames.has(file.name.toLowerCase())
      if (filter === 'used') return inUse
      if (filter === 'unused') return !inUse
      return true
    })
  }, [files, filter, usedFilenames])

  const counts = useMemo(() => {
    let used = 0
    for (const file of files) {
      if (usedFilenames.has(file.name.toLowerCase())) used += 1
    }
    return { total: files.length, used, unused: files.length - used }
  }, [files, usedFilenames])

  async function confirmDelete() {
    if (!pendingDelete || isAssetInUse(pendingDelete.name, config)) return

    const file = pendingDelete
    setDeleting(file.name)
    setError(null)
    try {
      await deleteAsset(file.name)
      setFiles((prev) => prev.filter((f) => f.name !== file.name))
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleting(null)
    }
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const data = await readAsBase64(file)
      const response = await fetch(ENDPOINTS.upload, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data }),
      })
      if (!response.ok) throw new Error('Falha no upload')
      await load()
    } catch {
      setError('Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
    }
  }

  function copyPath(path: string) {
    void navigator.clipboard.writeText(path)
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: counts.total },
    { id: 'used', label: 'Em uso', count: counts.used },
    { id: 'unused', label: 'Livres', count: counts.unused },
  ]

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Galeria de imagens</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Arquivos em <code className="text-xs">assets/</code>. Imagens em uso na bio não podem ser excluídas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              onClick={() => load()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Enviando…' : 'Enviar imagem'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && files.length === 0 ? (
        <div className="card flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando galeria…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm text-muted-foreground">
            {files.length === 0
              ? 'Nenhuma imagem em assets/ ainda.'
              : 'Nenhuma imagem neste filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((file) => {
            const inUse = usedFilenames.has(file.name.toLowerCase())
            return (
              <article
                key={file.name}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted/40">
                  <img
                    src={resolvePublicUrl(file.path)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      inUse
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-black/50 text-white/90 backdrop-blur-sm'
                    }`}
                  >
                    {inUse ? 'Em uso' : 'Livre'}
                  </span>
                </div>

                <div className="space-y-2 p-3">
                  <p className="truncate text-xs font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)} ·{' '}
                    {new Date(file.modified * 1000).toLocaleDateString('pt-BR')}
                  </p>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn-secondary flex flex-1 items-center justify-center gap-1 px-2 py-1 text-[10px]"
                      onClick={() => copyPath(file.path)}
                      title="Copiar caminho"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                    <button
                      type="button"
                      className="btn-danger flex items-center justify-center px-2 py-1 text-[10px] disabled:opacity-40"
                      disabled={inUse || deleting === file.name}
                      onClick={() => !inUse && setPendingDelete(file)}
                      title={inUse ? 'Remova da bio antes de excluir' : 'Excluir'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleUpload(file)
          e.currentTarget.value = ''
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir imagem?"
        description={
          <>
            <span className="font-medium text-foreground">{pendingDelete?.name}</span> será removida
            permanentemente do servidor. Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
      />
    </div>
  )
}
