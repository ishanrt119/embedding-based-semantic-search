"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, userData: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("auth_token")
      if (!storedToken) {
        setIsLoading(false)
        if (pathname?.startsWith("/dashboard")) {
          router.push("/login")
        }
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`, {
          headers: {
            "Authorization": `Bearer ${storedToken}`
          }
        })
        
        if (res.ok) {
          const userData = await res.json()
          setToken(storedToken)
          setUser(userData)
        } else {
          // Token invalid or expired
          localStorage.removeItem("auth_token")
          setToken(null)
          setUser(null)
          if (pathname?.startsWith("/dashboard")) {
            router.push("/login")
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [pathname, router])

  // Provide fetch wrapper that automatically adds the token
  useEffect(() => {
    if (!token) return
    
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [resource, config] = args
      
      // Only intercept local API calls
      if (typeof resource === 'string' && resource.startsWith(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`)) {
        const newConfig = { ...config }
        newConfig.headers = {
          ...newConfig.headers,
          "Authorization": `Bearer ${token}`
        }
        
        const response = await originalFetch(resource, newConfig)
        if (response.status === 401) {
          logout()
        }
        return response
      }
      return originalFetch(resource, config)
    }
    
    return () => {
      window.fetch = originalFetch
    }
  }, [token])

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("auth_token", newToken)
    setToken(newToken)
    setUser(userData)
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
