import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCurrentUser, getStoredToken, login as loginRequest, logout as logoutRequest } from '../services/auth'
import type { LoginRequest, RegisterRequest, User } from '../types/auth'
import { register as registerRequest } from '../services/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      return
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        logoutRequest()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginRequest(payload)
    setUser(response.user)
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    await registerRequest(payload)
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
