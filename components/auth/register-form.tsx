"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Building2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { generateTenantSlug, validateTenantSlug } from "@/lib/utils/tenant"
import Link from "next/link"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [tenantSlug, setTenantSlug] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registrationType, setRegistrationType] = useState<"create" | "join">("create")

  const { register } = useAuth()
  const router = useRouter()

  const handleTenantNameChange = (value: string) => {
    setTenantName(value)
    setTenantSlug(generateTenantSlug(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (registrationType === "create") {
        if (!tenantName.trim()) {
          setError("Company name is required")
          return
        }

        if (!validateTenantSlug(tenantSlug)) {
          setError("Invalid company name. Please use only letters, numbers, and hyphens.")
          return
        }

        await register(email, password, name, { name: tenantName, slug: tenantSlug })
      } else {
        await register(email, password, name)
      }

      router.push("/dashboard")
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Get started</CardTitle>
        <CardDescription>Create your TaskFlow account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as "create" | "join")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Create Company
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Join Team
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="create" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Software House"
                  value={tenantName}
                  onChange={(e) => handleTenantNameChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {tenantSlug && (
                  <p className="text-xs text-muted-foreground">Your workspace URL: taskflow.com/{tenantSlug}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invitation Code</Label>
                <Input id="invite-code" placeholder="Enter invitation code" disabled={isLoading} />
                <p className="text-xs text-muted-foreground">Ask your admin for an invitation code</p>
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {registrationType === "create" ? "Create Account & Company" : "Join Team"}
            </Button>
          </form>
        </Tabs>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
