import { api } from '../../shared/http'
import type { BioConfig } from '@bio-types'

/**
 * Chamadas HTTP do onboarding.
 */
export const onboardingApi = {
  checkSlug(slug: string) {
    return api<{ ok: boolean; error?: string; slug: string }>(
      `/api/onboarding/slug?slug=${encodeURIComponent(slug)}`,
    )
  },

  complete(slug: string, themePackId: string, config: BioConfig) {
    return api<{ redirect: string }>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({ slug, theme_pack_id: themePackId, config }),
    })
  },
}
