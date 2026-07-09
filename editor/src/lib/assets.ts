import { ENDPOINTS } from './endpoints'

export type AssetFile = {
  name: string
  path: string
  size: number
  modified: number
}

export async function listAssets(): Promise<AssetFile[]> {
  const res = await fetch(ENDPOINTS.listAssets, { credentials: 'include' })
  if (!res.ok) throw new Error('Não foi possível listar as imagens')
  const data = (await res.json()) as { files: AssetFile[] }
  return data.files
}

export async function deleteAsset(name: string): Promise<void> {
  const res = await fetch(ENDPOINTS.deleteAsset, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível excluir a imagem')
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
