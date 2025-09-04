"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, Building2, Palette, Save } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

export function TenantSettings() {
  const { tenant, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Form state
  const [tenantName, setTenantName] = useState(tenant?.name || "")
  const [tenantSlug, setTenantSlug] = useState(tenant?.slug || "")
  const [primaryColor, setPrimaryColor] = useState(tenant?.branding?.primaryColor || "#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState(tenant?.branding?.secondaryColor || "#64748b")
  const [allowClientAccess, setAllowClientAccess] = useState(tenant?.settings?.allowClientAccess || false)

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Mock API call - in real app, update tenant settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess("Settings saved successfully!")
    } catch (err) {
      setError("Failed to save settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!tenant || user?.role !== "admin") {
    return (
      <Alert>
        <AlertDescription>You don't have permission to manage tenant settings.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-gray-600 mt-2">Manage your software house workspace configuration and branding.</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Update your workspace name and URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Workspace Name</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Acme Software House"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Workspace URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">taskflow.com/</span>
                <Input
                  id="tenant-slug"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="acme"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Branding</CardTitle>
          </div>
          <CardDescription>Customize your workspace appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                TF
              </div>
              <Badge style={{ backgroundColor: secondaryColor, color: "white" }}>Sample Badge</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>Configure workspace behavior and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="client-access">Allow Client Access</Label>
              <p className="text-sm text-muted-foreground">Enable clients to view assigned projects and tasks</p>
            </div>
            <Switch id="client-access" checked={allowClientAccess} onCheckedChange={setAllowClientAccess} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
