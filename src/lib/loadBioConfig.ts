import type { BioConfig } from '../types/bio'

const CONFIG_PATH = '/bio.json'

export async function loadBioConfig(): Promise<BioConfig> {
  const response = await fetch(CONFIG_PATH, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${CONFIG_PATH} (${response.status})`)
  }

  return response.json() as Promise<BioConfig>
}
