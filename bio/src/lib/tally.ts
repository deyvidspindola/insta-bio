declare global {
  interface Window {
    Tally?: {
      openPopup: (
        formId: string,
        options?: {
          layout?: 'default' | 'modal'
          width?: number
          hideTitle?: boolean
          overlay?: boolean
          autoClose?: number
        },
      ) => void
      closePopup?: (formId: string) => void
      loadEmbeds?: () => void
    }
  }
}

const TALLY_SCRIPT = 'https://tally.so/widgets/embed.js'

let loadPromise: Promise<void> | null = null

/** Extrai o form ID de URLs Tally (`/r/`, `/embed/`, path curto). */
export function parseTallyFormId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    const host = url.hostname.replace(/^www\./, '')
    if (host !== 'tally.so') return null

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'r' || parts[0] === 'embed') {
      return parts[1] || null
    }
    // URL curta: tally.so/XXXX
    if (parts.length === 1 && /^[a-zA-Z0-9]+$/.test(parts[0]!)) {
      return parts[0]!
    }
  } catch {
    // fall through
  }

  // Só o ID colado no campo
  if (/^[a-zA-Z0-9]{4,20}$/.test(raw)) return raw

  return null
}

export function loadTallyScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.Tally?.openPopup) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TALLY_SCRIPT}"]`)
    if (existing) {
      if (window.Tally?.openPopup) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Tally')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = TALLY_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Falha ao carregar Tally'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export async function openTallyPopup(formId: string): Promise<void> {
  await loadTallyScript()
  if (!window.Tally?.openPopup) {
    throw new Error('Tally não disponível')
  }
  window.Tally.openPopup(formId, { layout: 'modal', width: 700 })
}
