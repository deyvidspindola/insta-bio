/** Lat/lng parseados de URLs do Google Maps (longas ou já expandidas). */
export type MapsCoords = { lat: number; lng: number; zoom?: number }

/** Zoom padrão do embed — 18 costuma mostrar o nome do lugar no pin. */
const DEFAULT_EMBED_ZOOM = 18

function isFiniteCoord(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n) <= 90
}

function isFiniteLng(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n) <= 180
}

function clampZoom(z: number | undefined): number {
  if (typeof z !== 'number' || !Number.isFinite(z)) return DEFAULT_EMBED_ZOOM
  return Math.min(21, Math.max(12, Math.round(z)))
}

function embedWithPin(lat: number, lng: number, zoom?: number): string {
  const z = clampZoom(zoom)
  return `https://maps.google.com/maps?q=${lat}%2C${lng}&z=${z}&output=embed`
}

/** Hosts que o iframe do Google consegue usar como `q=` (inclui link curto). */
export function isGoogleMapsUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host === 'maps.app.goo.gl' || host === 'goo.gl') return true
    if (host === 'maps.google.com' || host === 'google.com' || host.endsWith('.google.com')) {
      return url.pathname.includes('/maps') || host.startsWith('maps.')
    }
    return false
  } catch {
    return /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[^/]+\/maps/i.test(s)
  }
}

export function isShortGoogleMapsUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    return host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'))
  } catch {
    return /maps\.app\.goo\.gl\//i.test(s) || /goo\.gl\/maps\//i.test(s)
  }
}

/**
 * Extrai coordenadas (e zoom, se houver) de URLs longas do Maps:
 * - .../@-23.55,-46.63,18z
 * - ...!3d-23.55!4d-46.63
 * - ?q=-23.55,-46.63 / ?ll=...
 */
export function parseMapsCoords(raw: string): MapsCoords | null {
  const s = raw.trim()
  if (!s) return null

  const at = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,(\d+(?:\.\d+)?)z)?/)
  if (at) {
    const lat = Number(at[1])
    const lng = Number(at[2])
    if (isFiniteCoord(lat) && isFiniteLng(lng)) {
      const zoom = at[3] != null ? Number(at[3]) : undefined
      return { lat, lng, zoom: Number.isFinite(zoom) ? zoom : undefined }
    }
  }

  const d3 = s.match(/!3d(-?\d+\.?\d*)/)
  const d4 = s.match(/!4d(-?\d+\.?\d*)/)
  if (d3 && d4) {
    const lat = Number(d3[1])
    const lng = Number(d4[1])
    if (isFiniteCoord(lat) && isFiniteLng(lng)) return { lat, lng }
  }

  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    const zoomParam = url.searchParams.get('z')
    const zoomFromQuery = zoomParam != null ? Number(zoomParam) : undefined
    for (const key of ['q', 'query', 'll', 'center'] as const) {
      const v = url.searchParams.get(key)
      if (!v) continue
      const m = v.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/)
      if (m) {
        const lat = Number(m[1])
        const lng = Number(m[2])
        if (isFiniteCoord(lat) && isFiniteLng(lng)) {
          return {
            lat,
            lng,
            zoom: Number.isFinite(zoomFromQuery) ? zoomFromQuery : undefined,
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return null
}

export function mapsEmbedUrl(opts: {
  mapUrl?: string
  address?: string
  lat?: number | null
  lng?: number | null
  zoom?: number | null
}): string | null {
  const lat = opts.lat
  const lng = opts.lng
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFiniteCoord(lat) &&
    isFiniteLng(lng)
  ) {
    return embedWithPin(lat, lng, opts.zoom ?? undefined)
  }

  const mapUrl = opts.mapUrl?.trim() ?? ''
  if (mapUrl) {
    const fromLink = parseMapsCoords(mapUrl)
    if (fromLink) {
      return embedWithPin(fromLink.lat, fromLink.lng, fromLink.zoom ?? opts.zoom ?? undefined)
    }
    // Link curto (maps.app.goo.gl) ou URL longa sem @coords: o Maps resolve no iframe.
    if (isGoogleMapsUrl(mapUrl)) {
      const z = clampZoom(opts.zoom ?? undefined)
      return `https://maps.google.com/maps?q=${encodeURIComponent(mapUrl)}&z=${z}&output=embed`
    }
  }

  const address = opts.address?.trim() ?? ''
  if (address) {
    const z = clampZoom(opts.zoom ?? undefined)
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${z}&output=embed`
  }

  return null
}
