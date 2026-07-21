import { ENDPOINTS } from './endpoints'

export type AssetFile = {
  name: string
  path: string
  size: number
  modified: number
}

const VIDEO_EXT = new Set(['mp4', 'webm', 'mov'])

export function isVideoAsset(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return VIDEO_EXT.has(ext)
}

export async function listAssets(): Promise<AssetFile[]> {
  const res = await fetch(ENDPOINTS.listAssets, { credentials: 'include' })
  if (!res.ok) throw new Error('Não foi possível listar os arquivos')
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
    throw new Error(data?.error ?? 'Não foi possível excluir o arquivo')
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
