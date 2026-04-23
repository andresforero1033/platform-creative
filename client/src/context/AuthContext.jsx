import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import AuthContext from './AuthContextValue'

const ACCESS_TOKEN_KEY = 'creative_access_token'
const REFRESH_TOKEN_KEY = 'creative_refresh_token'
const USER_KEY = 'creative_user'

function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

function getDashboardPathByRole(role) {
  switch (role) {
    case 'admin':
      return '/dashboard/admin'
    case 'supervisor':
      return '/dashboard/supervisor'
    case 'teacher':
      return '/dashboard/teacher'
    case 'parent':
      return '/dashboard/parent'
    case 'student':
    default:
      return '/dashboard/student'
  }
}

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeUser(user) {
  if (!user) return null

  return {
    ...user,
    badges: Array.isArray(user.badges) ? user.badges : [],
    currentStreak: Number.isFinite(user.currentStreak) ? user.currentStreak : 0,
    longestStreak: Number.isFinite(user.longestStreak) ? user.longestStreak : 0,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  const persistSession = useCallback((payload) => {
    if (payload.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken)
      setAuthHeader(payload.accessToken)
    }

    if (payload.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken)
    }

    if (payload.user) {
      const normalizedUser = normalizeUser(payload.user)
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
      setUser(normalizedUser)
    }
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuthHeader(null)
    setUser(null)
  }, [])

  const checkAuth = useCallback(async () => {
    setLoading(true)

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const storedUser = readStoredUser()

    if (!accessToken && !refreshToken && !storedUser) {
      clearSession()
      setLoading(false)
      return { authenticated: false }
    }

    try {
      if (accessToken) {
        setAuthHeader(accessToken)
      }

      // Si existe endpoint /auth/me se usa primero para obtener perfil vigente.
      const meResponse = await api.get('/auth/me')
      const meUser = meResponse?.data?.data?.user || meResponse?.data?.data || meResponse?.data?.user
      persistSession({ accessToken, refreshToken, user: meUser || storedUser })
      setLoading(false)

      return { authenticated: true, user: meUser || storedUser }
    } catch {
      try {
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const refreshResponse = await api.post('/auth/refresh', { refreshToken })
        const newAccessToken = refreshResponse?.data?.data?.accessToken

        if (!newAccessToken) {
          throw new Error('Access token no recibido')
        }

        persistSession({ accessToken: newAccessToken, refreshToken, user: storedUser })
        setLoading(false)

        return { authenticated: !!storedUser, user: storedUser }
      } catch {
        clearSession()
        setLoading(false)
        return { authenticated: false }
      }
    }
  }, [clearSession, persistSession])

  const login = useCallback(async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password })
    const data = response?.data?.data || {}

    persistSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    })

    return {
      user: normalizeUser(data.user),
      dashboardPath: getDashboardPathByRole(data?.user?.role),
    }
  }, [persistSession])

  const register = useCallback(async (payload) => {
    const response = await api.post('/auth/register', payload)
    const data = response?.data?.data || {}

    persistSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    })

    return {
      user: normalizeUser(data.user),
      dashboardPath: getDashboardPathByRole(data?.user?.role),
    }
  }, [persistSession])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Ignoramos errores de red/revocación para no bloquear cierre local.
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    getDashboardPathByRole,
  }), [user, loading, isAuthenticated, login, register, logout, checkAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
