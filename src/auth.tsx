import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, loadSession, saveSession, setSessionExpiredHandler } from '#/lib/api'
import type { AuthResponse, User } from '#/lib/types'

export interface AuthState {
  status: 'loading' | 'authenticated' | 'anonymous'
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  can: (...permissions: string[]) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthState['status']>(() => (loadSession() ? 'loading' : 'anonymous'))

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      setStatus('anonymous')
    })
    if (!loadSession()) return
    api
      .get<User>('/auth/me')
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        saveSession(null)
        setStatus('anonymous')
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.public.post<AuthResponse>('/auth/login', { email, password })
    saveSession({ accessToken: res.accessToken, refreshToken: res.refreshToken })
    setUser(res.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    const session = loadSession()
    if (session) {
      await api.public.post('/auth/logout', { refreshToken: session.refreshToken }).catch(() => {})
    }
    saveSession(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      user,
      login,
      logout,
      can: (...permissions) => !!user && permissions.every((p) => user.permissions.includes(p)),
    }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
