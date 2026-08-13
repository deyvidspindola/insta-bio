/**
 * Cliente HTTP autenticado (cookie de sessão + CSRF) para as APIs Laravel.
 */

/**
 * Monta headers padrão, incluindo X-XSRF-TOKEN quando o cookie existe.
 */
export function csrfHeaders(json = true): HeadersInit {
  const token = decodeURIComponent(
    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
  )
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (token) headers['X-XSRF-TOKEN'] = token
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

/**
 * Fetch JSON com credenciais. Lança Error com a mensagem da API em caso de falha.
 */
export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(csrfHeaders(!init.body || typeof init.body === 'string'))
  if (init.headers) {
    const extra = new Headers(init.headers)
    extra.forEach((value, key) => headers.set(key, value))
  }
  if (init.body instanceof FormData) {
    headers.delete('Content-Type')
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })

  const data = (await res.json().catch(() => null)) as T & { error?: string; message?: string }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Falha (${res.status})`)
  }
  return data
}
