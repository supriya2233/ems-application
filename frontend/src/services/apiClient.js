/*
 * One place for the backend address, plus an ID for this browser tab.
 *
 * Every request to the API carries the header `X-Client-Id`. When
 * this tab saves something, the server tags the resulting live
 * event with that ID, so this tab can skip the "someone changed
 * something" toast for its own action (it already shows "Saved").
 */
// Override with VITE_API_URL (e.g. to point at a demo backend);
// see the README. Without it, the usual local backend is used.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const CLIENT_ID =
  globalThis.crypto?.randomUUID?.() ??
  `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`

/*
 * The older service files call fetch() directly. Instead of editing
 * all of them, wrap fetch once: requests to our API get the header,
 * anything else passes through untouched.
 */
export function installClientIdHeader() {
  if (window.fetch.emsClientId) return

  const originalFetch = window.fetch.bind(window)

  const fetchWithClientId = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input))

    if (!url.startsWith(API_BASE)) {
      return originalFetch(input, init)
    }

    const headers = new Headers(
      init.headers || (input instanceof Request ? input.headers : undefined),
    )
    headers.set('X-Client-Id', CLIENT_ID)

    return originalFetch(input, { ...init, headers })
  }

  fetchWithClientId.emsClientId = true
  window.fetch = fetchWithClientId
}

/* Small helper for the newer service files. */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`)
  }

  return result
}
