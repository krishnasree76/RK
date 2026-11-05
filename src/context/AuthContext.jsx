import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onUnauthorized, setAuthToken } from '../services/api'
import { fetchMe, logout, updateMe } from '../services/authService'

const TOKEN_KEY = 'rk-auth-token'
const USER_KEY = 'rk-auth-user'

const AuthContext = createContext(null)

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable — the session lasts until the tab closes.
  }
}

function initialState() {
  const token = read(TOKEN_KEY)
  let user = null
  try {
    user = token ? JSON.parse(read(USER_KEY) || 'null') : null
  } catch {
    user = null
  }
  setAuthToken(token)
  // 'checking' while a saved token is verified with the backend.
  return { token, user, status: token ? 'checking' : 'anonymous' }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState)

  const clearSession = useCallback(() => {
    write(TOKEN_KEY, null)
    write(USER_KEY, null)
    setAuthToken(null)
    setState({ token: null, user: null, status: 'anonymous' })
  }, [])

  const storeUser = useCallback((user) => {
    write(USER_KEY, JSON.stringify(user))
    setState((s) => ({ ...s, user, status: 'authenticated' }))
  }, [])

  // A rejected token (expired / signed out elsewhere) ends the session.
  useEffect(() => {
    onUnauthorized(clearSession)
    return () => onUnauthorized(null)
  }, [clearSession])

  // Verify a saved token once on load.
  useEffect(() => {
    if (state.status !== 'checking') return undefined
    const controller = new AbortController()
    fetchMe({ signal: controller.signal })
      .then(storeUser)
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error.status === 401) clearSession()
        // Offline / server down: keep the cached profile so the UI stays signed in.
        else setState((s) => ({ ...s, status: s.user ? 'authenticated' : 'anonymous' }))
      })
    return () => controller.abort()
  }, [state.status, storeUser, clearSession])

  // Called with the API response from register / login / Google sign-in.
  const completeAuth = useCallback(({ token, user }) => {
    write(TOKEN_KEY, token)
    write(USER_KEY, JSON.stringify(user))
    setAuthToken(token)
    setState({ token, user, status: 'authenticated' })
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // Already invalid or offline — clear locally either way.
    }
    clearSession()
  }, [clearSession])

  const updateProfile = useCallback(
    async (changes) => {
      const user = await updateMe(changes)
      storeUser(user)
      return user
    },
    [storeUser],
  )

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === 'authenticated' && Boolean(state.user),
      isChecking: state.status === 'checking',
      completeAuth,
      signOut,
      updateProfile,
    }),
    [state, completeAuth, signOut, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Only allow internal redirect targets (e.g. "/cart"), never other sites.
export const safeNext = (value, fallback = '/account') =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback
