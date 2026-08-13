import { ENDPOINTS } from './endpoints'

export type EditorPathsInfo = {
  bioJsonPath: string
  assetsDir: string
  draftPath: string
  publicBioUrl?: string
  configFile: string
  bioExists: boolean
  draftExists: boolean
  writable: boolean
}

export async function fetchEditorPaths(): Promise<EditorPathsInfo> {
  const res = await fetch(ENDPOINTS.paths, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível carregar os caminhos')
  }
  const data = (await res.json()) as { paths: EditorPathsInfo }
  return data.paths
}

export async function saveEditorPaths(bioJsonPath: string): Promise<EditorPathsInfo> {
  const res = await fetch(ENDPOINTS.paths, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bioJsonPath: bioJsonPath.trim() }),
  })
  const data = (await res.json().catch(() => null)) as {
    error?: string
    paths?: EditorPathsInfo
  } | null
  if (!res.ok) {
    throw new Error(data?.error ?? 'Não foi possível salvar o caminho')
  }
  if (!data?.paths) {
    throw new Error('Resposta inválida do servidor')
  }
  return data.paths
}
