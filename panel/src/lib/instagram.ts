import { ENDPOINTS } from './endpoints'

export type InstagramProfile = {
  username: string
  fullName: string
  biography: string | null
  profilePicUrl: string
  profileUrl: string
}

export async function lookupInstagram(handle: string): Promise<InstagramProfile> {
  const res = await fetch(ENDPOINTS.instagramLookup, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle }),
  })
  const data = (await res.json().catch(() => null)) as {
    error?: string
    profile?: InstagramProfile
  } | null
  if (!res.ok) throw new Error(data?.error ?? 'Não foi possível buscar o Instagram')
  if (!data?.profile) throw new Error('Resposta inválida do servidor')
  return data.profile
}
