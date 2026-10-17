const TOKEN_KEY = 'atelie.sessionToken'
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export function getSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setSessionToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearSessionToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...requestOptions } = options
  const token = getSessionToken()
  const requestHeaders = { ...headers }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload.error ?? `Falha na API (${response.status}).`)
    error.status = response.status
    throw error
  }

  return payload
}
