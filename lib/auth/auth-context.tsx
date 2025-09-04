"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Tenant } from "../types/database"

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    name: string,
    tenantData?: { name: string; slug: string },
  ) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      // In a real app, validate token with backend
      const userData = localStorage.getItem("user_data")
      const tenantData = localStorage.getItem("tenant_data")

      if (userData && tenantData) {
        setUser(JSON.parse(userData))
        setTenant(JSON.parse(tenantData))
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      localStorage.removeItem("tenant_data")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock login - in real app, call your auth API
      const mockUser: User = {
        id: "user_1",
        tenantId: "tenant_1",
        email,
        name: "John Doe",
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockTenant: Tenant = {
        id: "tenant_1",
        name: "Acme Software House",
        slug: "acme",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store auth data
      localStorage.setItem("auth_token", "mock_token_123")
      localStorage.setItem("user_data", JSON.stringify(mockUser))
      localStorage.setItem("tenant_data", JSON.stringify(mockTenant))

      setUser(mockUser)
      setTenant(mockTenant)
    } catch (error) {
      throw new Error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    tenantData?: { name: string; slug: string },
  ) => {
    setIsLoading(true)
    try {
      // Mock registration - in real app, call your auth API
      const mockTenant: Tenant = {
        id: "tenant_new",
        name: tenantData?.name || "New Software House",
        slug: tenantData?.slug || "new-house",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUser: User = {
        id: "user_new",
        tenantId: mockTenant.id,
        email,
        name,
        role: tenantData ? "admin" : "member", // Admin if creating tenant, member if joining
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store auth data
      localStorage.setItem("auth_token", "mock_token_new")
      localStorage.setItem("user_data", JSON.stringify(mockUser))
      localStorage.setItem("tenant_data", JSON.stringify(mockTenant))

      setUser(mockUser)
      setTenant(mockTenant)
    } catch (error) {
      throw new Error("Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    localStorage.removeItem("tenant_data")
    setUser(null)
    setTenant(null)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Import permission checking logic
    const { hasPermission: checkPermission } = require("./permissions")
    return checkPermission(user.role, permission)
  }

  const value = {
    user,
    tenant,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
