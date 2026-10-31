import type { AuthResponse } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1'
const STORAGE_KEY = 'apex.session'

export interface Session {
  accessToken: string
  refreshToken: string
}

export class ApiError extends Error {
  status: number
  details: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable; session lives for this page only
  }
}

let onSessionExpired: () => void = () => {}
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn
}

let refreshing: Promise<Session | null> | null = null

function refreshSession(): Promise<Session | null> {
  refreshing ??= (async () => {
    const current = loadSession()
    if (!current) return null
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as AuthResponse
    const next = { accessToken: data.accessToken, refreshToken: data.refreshToken }
    saveSession(next)
    return next
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

type Params = Record<string, string | number | boolean | undefined | null>

function buildUrl(path: string, params?: Params) {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  return url.toString()
}

async function request<T>(method: string, path: string, opts: { params?: Params; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const { params, body, auth = true } = opts
  const send = (token?: string) =>
    fetch(buildUrl(path, params), {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let res = await send(auth ? loadSession()?.accessToken : undefined)

  if (res.status === 401 && auth) {
    const next = await refreshSession()
    if (next) {
      res = await send(next.accessToken)
    } else {
      saveSession(null)
      onSessionExpired()
    }
  }

  if (!res.ok) {
    let message = res.statusText || 'Request failed'
    let details: unknown
    try {
      const err = (await res.json()) as { message?: string; details?: unknown }
      message = err.message ?? message
      details = err.details
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message, details)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  public: {
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body, auth: false }),
  },
}
