"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { FolderOpen, Calendar, Users, CheckCircle, Clock, ArrowLeft, Edit, Archive } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { TaskBoard } from "@/components/tasks/task-board"
import type { ProjectStatus } from "@/lib/types/database"

interface ProjectDetailProps {
  projectId: string
}

// Mock project detail data
const mockProjectDetail = {
  id: "proj_1",
  title: "E-commerce Platform Redesign",
  description:
    "Complete redesign of the client's e-commerce platform with modern UI/UX, improved performance, and mobile responsiveness. This project includes user research, wireframing, design system creation, and full implementation.",
  status: "active" as ProjectStatus,
  deadline: new Date("2024-03-15"),
  createdAt: new Date("2024-01-10"),
  manager: {
    id: "user_2",
    name: "Sarah Wilson",
    email: "sarah@acme.com",
    avatar: "/placeholder.svg",
  },
  team: [
    { id: "user_3", name: "Mike Johnson", role: "team_lead", avatar: "/placeholder.svg" },
    { id: "user_4", name: "Alex Chen", role: "member", avatar: "/placeholder.svg" },
    { id: "user_5", name: "Emma Davis", role: "member", avatar: "/placeholder.svg" },
  ],
  client: {
    id: "client_1",
    name: "TechCorp Inc.",
    email: "contact@techcorp.com",
  },
  stats: {
    totalTasks: 24,
    completedTasks: 18,
    inProgressTasks: 4,
    todoTasks: 2,
  },
  recentActivity: [
    {
      id: "1",
      action: "Task completed",
      description: "Homepage design mockups",
      user: "Alex Chen",
      timestamp: new Date("2024-01-20T10:30:00"),
    },
    {
      id: "2",
      action: "Task assigned",
      description: "Mobile responsive layout",
      user: "Sarah Wilson",
      timestamp: new Date("2024-01-20T09:15:00"),
    },
    {
      id: "3",
      action: "Comment added",
      description: "Product page feedback",
      user: "Emma Davis",
      timestamp: new Date("2024-01-19T16:45:00"),
    },
  ],
}

const statusColors: Record<ProjectStatus, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-orange-100 text-orange-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { hasPermission } = useAuth()
  const [project] = useState(mockProjectDetail)

  const progressPercentage = Math.round((project.stats.completedTasks / project.stats.totalTasks) * 100)
  const canManageProject = hasPermission("manage_all_projects") || hasPermission("manage_assigned_projects")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    return "Just now"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <Badge className={statusColors[project.status]}>{project.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
        </div>

        {canManageProject && (
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
            <Button variant="outline">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>
        )}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{project.stats.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{project.stats.inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{project.team.length + 1}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
                <p className="text-sm text-gray-600">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Progress */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Track completion status and milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{project.stats.completedTasks}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{project.stats.inProgressTasks}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{project.stats.todoTasks}</p>
                    <p className="text-sm text-gray-600">To Do</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Deadline</p>
                  <p className="text-sm">{formatDate(project.deadline)}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600">Project Manager</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {project.manager.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{project.manager.name}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-sm">{project.client.name}</p>
                  <p className="text-xs text-gray-500">{project.client.email}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm">{formatDate(project.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <TaskBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Project team and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Project Manager */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {project.manager.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.manager.name}</p>
                      <p className="text-sm text-muted-foreground">{project.manager.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Project Manager</Badge>
                </div>

                {/* Team Members */}
                {project.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">Team Member</p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
