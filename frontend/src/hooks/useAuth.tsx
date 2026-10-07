import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { api, type AuthResponse, type LoginRequest } from '../lib/api'

interface User {
  id: number
  login: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data)
      } catch {
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [token])

  const login = async (data: LoginRequest) => {
    const { data: authData } = await api.post<AuthResponse>('/auth/login', data)
    localStorage.setItem('token', authData.access_token)
    setToken(authData.access_token)
    const { data: userData } = await api.get('/auth/me')
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
