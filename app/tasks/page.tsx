import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TaskBoard } from "@/components/tasks/task-board"

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <TaskBoard />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
