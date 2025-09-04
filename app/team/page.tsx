import { ProtectedRoute } from "@/components/auth/protected-route"
import { UserManagement } from "@/components/tenant/user-management"

export default function TeamPage() {
  return (
    <ProtectedRoute requiredPermissions={["manage_users"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <UserManagement />
        </div>
      </div>
    </ProtectedRoute>
  )
}
