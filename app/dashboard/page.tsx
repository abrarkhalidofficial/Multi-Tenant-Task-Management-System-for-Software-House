"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { Plus, FolderOpen, CheckSquare, Clock } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const projects = useQuery(api.projects.getProjectsByTenant)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/auth")
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return null
  }

  const activeProjects = projects?.filter((p) => p.status === "active") || []
  const totalTasks = 0 // This would be calculated from tasks
  const completedTasks = 0 // This would be calculated from tasks

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {currentUser.name}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
          </div>
          {(currentUser.role === "admin" || currentUser.role === "project_manager") && (
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your most recently updated projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              project.status === "active"
                                ? "bg-green-100 text-green-800"
                                : project.status === "planning"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.status === "on_hold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : project.status === "completed"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/projects/${project._id}`}>View Project</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No projects yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first project.</p>
                  {(currentUser.role === "admin" || currentUser.role === "project_manager") && (
                    <div className="mt-6">
                      <Button asChild>
                        <Link href="/projects/new">
                          <Plus className="mr-2 h-4 w-4" />
                          New Project
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityFeed limit={10} />
        </div>
      </div>
    </div>
  )
}
