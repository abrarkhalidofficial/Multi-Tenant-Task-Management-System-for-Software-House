import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <DashboardOverview />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
