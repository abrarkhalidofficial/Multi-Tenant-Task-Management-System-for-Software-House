"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Users, Settings, Plus, CheckSquare, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect } from "react"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const project = useQuery(api.projects.getProject, { projectId: params.id as Id<"projects"> })
  const tasks = useQuery(api.tasks.getTasksByProject, { projectId: params.id as Id<"projects"> })

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

  if (!isAuthenticated || !currentUser || !project) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Not set"
    return new Date(timestamp).toLocaleDateString()
  }

  const todoTasks = tasks?.filter((task) => task.status === "todo") || []
  const inProgressTasks = tasks?.filter((task) => task.status === "in_progress") || []
  const reviewTasks = tasks?.filter((task) => task.status === "review") || []
  const doneTasks = tasks?.filter((task) => task.status === "done") || []

  const canManageProject =
    currentUser.role === "admin" || currentUser.role === "project_manager" || project.managerId === currentUser._id

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>

        {/* Project Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
            </div>
            {project.description && <p className="text-muted-foreground max-w-2xl">{project.description}</p>}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Start: {formatDate(project.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>End: {formatDate(project.endDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/projects/${project._id}/tasks/new`}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
            {canManageProject && (
              <Button variant="outline" asChild>
                <Link href={`/projects/${project._id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doneTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Project Content */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
                <CardDescription>Track progress and manage tasks for this project</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    <Button asChild className="w-full">
                      <Link href={`/projects/${project._id}/board`}>View Kanban Board</Link>
                    </Button>
                    <div className="text-center text-muted-foreground">
                      {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first task to get started with this project.
                    </p>
                    <Button asChild>
                      <Link href={`/projects/${project._id}/tasks/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage team access and roles for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Team management coming soon</h3>
                  <p className="text-muted-foreground">Team member management will be available in the next update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Track changes and updates to this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Project activity will appear here as team members make changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
