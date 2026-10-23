import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, authApi } from '@/lib/api'
import { AuthContext } from '@/contexts/auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem('accessToken'))
  const [status, setStatus] = useState(() => (
    window.localStorage.getItem('accessToken') ? 'loading' : 'anonymous'
  ))
  const [user, setUser] = useState(null)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!token) return undefined

    let active = true
    authApi.getCurrentUser(token)
      .then((currentUser) => {
        if (!active) return
        setUser(currentUser)
        setSessionError('')
        setStatus('authenticated')
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem('accessToken')
          setToken(null)
          setUser(null)
          setStatus('anonymous')
          return
        }

        setSessionError(error.message || 'Não foi possível restaurar sua sessão.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [token])

  const restoreSession = useCallback(async () => {
    const storedToken = window.localStorage.getItem('accessToken')
    if (!storedToken) {
      setToken(null)
      setUser(null)
      setSessionError('')
      setStatus('anonymous')
      return
    }

    setStatus('loading')
    setSessionError('')
    setToken(storedToken)

    try {
      const currentUser = await authApi.getCurrentUser(storedToken)
      setUser(currentUser)
      setStatus('authenticated')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem('accessToken')
        setToken(null)
        setUser(null)
        setStatus('anonymous')
        return
      }

      setSessionError(error.message || 'Não foi possível restaurar sua sessão.')
      setStatus('error')
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setSessionError('')

    try {
      const session = await authApi.login(credentials)
      const currentUser = await authApi.getCurrentUser(session.accessToken)
      window.localStorage.setItem('accessToken', session.accessToken)
      setToken(session.accessToken)
      setUser(currentUser)
      setStatus('authenticated')
    } catch (error) {
      setToken(null)
      setUser(null)
      setStatus('anonymous')
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem('accessToken')
    setToken(null)
    setUser(null)
    setSessionError('')
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      sessionError,
      login,
      logout,
      restoreSession,
    }),
    [status, token, user, sessionError, login, logout, restoreSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
