// Central API client. The base URL comes from VITE_API_BASE_URL (see
// .env.example); components never build API URLs themselves.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')
const TIMEOUT_MS = 15000

// The signed-in customer's token. It is only attached to requests that need it
// ({ auth: true }) so public catalogue requests never fail because of a stale token.
let authToken = null
let unauthorizedHandler = null

export const setAuthToken = (token) => {
  authToken = token || null
}

export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler
}

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }

  // Field-level messages from DRF validation errors, e.g. { phone: 'Enter a valid…' }.
  get fieldErrors() {
    if (!this.data || typeof this.data !== 'object') return {}
    return Object.fromEntries(
      Object.entries(this.data)
        .filter(([key]) => key !== 'detail' && key !== 'non_field_errors')
        .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    )
  }
}

export const isNotFound = (error) => error instanceof ApiError && error.status === 404

function messageFrom(data, status) {
  if (data?.detail) return data.detail
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0]
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (status >= 500) return 'Something went wrong on our side. Please try again.'
  if (data && typeof data === 'object') return 'Please check the highlighted details.'
  return `Request failed (${status}).`
}

async function request(method, path, { params, body, signal, auth = false } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && authToken) headers.Authorization = `Token ${authToken}`

  // Abort on caller cancel (e.g. component unmount) or after a timeout.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), TIMEOUT_MS)
  const forwardAbort = () => controller.abort(signal.reason)
  signal?.addEventListener('abort', forwardAbort, { once: true })

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(
      error?.name === 'TimeoutError' || controller.signal.reason?.name === 'TimeoutError'
        ? 'The server took too long to respond. Please try again.'
        : 'Unable to reach the server. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }

  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    // Empty or non-JSON body
  }

  if (!response.ok) {
    if (response.status === 401 && auth) unauthorizedHandler?.()
    throw new ApiError(messageFrom(data, response.status), response.status, data)
  }
  return data
}

export const apiGet = (path, options) => request('GET', path, options)
export const apiPost = (path, body, options) => request('POST', path, { ...options, body })
export const apiPatch = (path, body, options) => request('PATCH', path, { ...options, body })
