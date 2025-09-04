import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { ProjectList } from "@/components/projects/project-list"

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <ProjectList />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
