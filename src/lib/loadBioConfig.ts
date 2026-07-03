import type { BioConfig } from '../types/bio'
import { bioJsonUrl } from './publicUrl'

export async function loadBioConfig(): Promise<BioConfig> {
  const configPath = bioJsonUrl()
  const response = await fetch(configPath, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${configPath} (${response.status})`)
  }

  return response.json() as Promise<BioConfig>
}
