declare global {
  interface Window {
    __BIO_JSON_PATH__?: string
    __ANALYTICS_KEY__?: string
    __ANALYTICS_URL__?: string
  }
}

const VISITOR_KEY = 'ib_vid'
const SESSION_KEY = 'ib_sid'

export type AnalyticsClickMeta = {
  sectionId?: string
  itemIndex?: number
  itemType?: string
  label?: string
  url: string
}

function isPreviewMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function getAnalyticsKey(): string | null {
  const key = window.__ANALYTICS_KEY__?.trim()
  return key || null
}

export function getAnalyticsUrl(): string | null {
  const url = window.__ANALYTICS_URL__?.trim()
  return url || null
}

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)?.trim()
    if (existing) return existing
    const id = randomUuid()
    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return randomUuid()
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)?.trim()
    if (existing) return existing
    const id = randomUuid()
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return randomUuid()
  }
}

function sendEvent(payload: Record<string, unknown>): void {
  if (isPreviewMode()) return

  const analyticsKey = getAnalyticsKey()
  const endpoint = getAnalyticsUrl()
  if (!analyticsKey || !endpoint) return

  const body = JSON.stringify({
    analytics_key: analyticsKey,
    occurred_at: new Date().toISOString(),
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    path: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    ...payload,
  })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(endpoint, blob)) return
    }
  } catch {
    // fallback abaixo
  }

  try {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    })
  } catch {
    // ignore — analytics não deve quebrar a bio
  }
}

export function trackPageview(): void {
  sendEvent({ event_type: 'pageview' })
}

export function trackClick(meta: AnalyticsClickMeta): void {
  const url = meta.url?.trim()
  if (!url) return

  sendEvent({
    event_type: 'click',
    meta: {
      section_id: meta.sectionId || undefined,
      item_index: typeof meta.itemIndex === 'number' ? meta.itemIndex : undefined,
      item_type: meta.itemType || undefined,
      label: meta.label || undefined,
      url,
    },
  })
}

/** Lê metadados do wrapper de preview (`data-preview-item`, etc.). */
export function trackMetaFromElement(el: Element | null): Omit<AnalyticsClickMeta, 'url'> {
  const wrap = el?.closest('[data-preview-item]') as HTMLElement | null
  if (!wrap) return {}

  const raw = wrap.getAttribute('data-preview-item') || ''
  const colon = raw.lastIndexOf(':')
  const sectionId = colon >= 0 ? raw.slice(0, colon) : raw
  const indexRaw = colon >= 0 ? raw.slice(colon + 1) : ''
  const itemIndex = indexRaw !== '' && !Number.isNaN(Number(indexRaw)) ? Number(indexRaw) : undefined

  return {
    sectionId: sectionId || undefined,
    itemIndex,
    itemType: wrap.getAttribute('data-item-type') || undefined,
    label: wrap.getAttribute('data-item-label') || undefined,
  }
}
