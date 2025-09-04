"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ children, requiredPermissions = [], fallbackPath = "/login" }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(fallbackPath)
      return
    }

    if (user && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) => hasPermission(permission))

      if (!hasAllPermissions) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, isLoading, requiredPermissions, router, fallbackPath, hasPermission])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) => hasPermission(permission))

    if (!hasAllPermissions) {
      return null
    }
  }

  return <>{children}</>
}
