import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { ProjectDetail } from "@/components/projects/project-detail"

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <ProjectDetail projectId={params.id} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
