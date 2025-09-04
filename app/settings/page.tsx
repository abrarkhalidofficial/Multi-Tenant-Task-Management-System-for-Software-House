import { ProtectedRoute } from "@/components/auth/protected-route"
import { TenantSettings } from "@/components/tenant/tenant-settings"

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPermissions={["manage_tenant"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <TenantSettings />
        </div>
      </div>
    </ProtectedRoute>
  )
}
