"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FolderOpen,
  CheckSquare,
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  MessageSquare,
  Clock,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import Link from "next/link"

// Mock dashboard data
const mockDashboardData = {
  stats: {
    activeProjects: { current: 12, change: +2, trend: "up" },
    tasksInProgress: { current: 48, change: -3, trend: "down" },
    teamMembers: { current: 15, change: +1, trend: "up" },
    completedThisWeek: { current: 23, change: +8, trend: "up" },
  },
  projectProgress: [
    {
      id: "proj_1",
      name: "E-commerce Platform",
      progress: 75,
      deadline: new Date("2024-03-15"),
      status: "active",
      tasksCompleted: 18,
      totalTasks: 24,
    },
    {
      id: "proj_2",
      name: "Mobile Banking App",
      progress: 25,
      deadline: new Date("2024-04-30"),
      status: "planning",
      tasksCompleted: 2,
      totalTasks: 8,
    },
    {
      id: "proj_3",
      name: "CRM Integration",
      progress: 100,
      deadline: new Date("2024-02-01"),
      status: "completed",
      tasksCompleted: 15,
      totalTasks: 15,
    },
  ],
  recentActivity: [
    {
      id: "1",
      type: "task_completed",
      user: "Alex Chen",
      action: "completed task",
      target: "Homepage design mockups",
      project: "E-commerce Platform",
      timestamp: new Date("2024-01-20T10:30:00"),
    },
    {
      id: "2",
      type: "task_assigned",
      user: "Sarah Wilson",
      action: "assigned task",
      target: "Mobile responsive layout",
      project: "E-commerce Platform",
      timestamp: new Date("2024-01-20T09:15:00"),
    },
    {
      id: "3",
      type: "comment_added",
      user: "Mike Johnson",
      action: "commented on",
      target: "Database schema setup",
      project: "CRM Integration",
      timestamp: new Date("2024-01-19T16:45:00"),
    },
    {
      id: "4",
      type: "project_created",
      user: "Sarah Wilson",
      action: "created project",
      target: "Mobile Banking App",
      project: null,
      timestamp: new Date("2024-01-19T14:20:00"),
    },
  ],
  upcomingDeadlines: [
    {
      id: "task_1",
      title: "User authentication implementation",
      project: "E-commerce Platform",
      assignee: "Mike Johnson",
      deadline: new Date("2024-01-25"),
      priority: "high",
    },
    {
      id: "task_2",
      title: "Mobile responsive testing",
      project: "E-commerce Platform",
      assignee: "Alex Chen",
      deadline: new Date("2024-01-28"),
      priority: "medium",
    },
    {
      id: "task_3",
      title: "API documentation",
      project: "Mobile Banking App",
      assignee: "Emma Davis",
      deadline: new Date("2024-02-02"),
      priority: "low",
    },
  ],
  teamPerformance: [
    {
      id: "user_3",
      name: "Mike Johnson",
      role: "Team Lead",
      tasksCompleted: 12,
      tasksInProgress: 3,
      efficiency: 92,
    },
    {
      id: "user_4",
      name: "Alex Chen",
      role: "Developer",
      tasksCompleted: 8,
      tasksInProgress: 2,
      efficiency: 88,
    },
    {
      id: "user_5",
      name: "Emma Davis",
      role: "Developer",
      tasksCompleted: 6,
      tasksInProgress: 4,
      efficiency: 85,
    },
  ],
}

const activityIcons = {
  task_completed: CheckSquare,
  task_assigned: Users,
  comment_added: MessageSquare,
  project_created: FolderOpen,
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
}

export function DashboardOverview() {
  const { user, tenant } = useAuth()
  const [timeRange, setTimeRange] = useState("7d")

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return "Just now"
  }

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 text-balance">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-gray-600 text-lg">Here's what's happening at {tenant?.name} today.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">{mockDashboardData.stats.activeProjects.current}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                {mockDashboardData.stats.activeProjects.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {mockDashboardData.stats.activeProjects.change > 0 ? "+" : ""}
              {mockDashboardData.stats.activeProjects.change} from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Tasks in Progress</p>
                <p className="text-3xl font-bold text-gray-900">{mockDashboardData.stats.tasksInProgress.current}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                </div>
                {mockDashboardData.stats.tasksInProgress.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {mockDashboardData.stats.tasksInProgress.change > 0 ? "+" : ""}
              {mockDashboardData.stats.tasksInProgress.change} from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">{mockDashboardData.stats.teamMembers.current}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                {mockDashboardData.stats.teamMembers.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mockDashboardData.stats.teamMembers.change > 0 ? "+" : ""}
              {mockDashboardData.stats.teamMembers.change} from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                <p className="text-3xl font-bold text-gray-900">{mockDashboardData.stats.completedThisWeek.current}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                {mockDashboardData.stats.completedThisWeek.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {mockDashboardData.stats.completedThisWeek.change > 0 ? "+" : ""}
              {mockDashboardData.stats.completedThisWeek.change} from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Progress */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="w-5 h-5 text-blue-600" />
                  Project Progress
                </CardTitle>
                <CardDescription>Track your active projects and their completion status</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <FolderOpen className="w-4 h-4" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDashboardData.projectProgress.map((project) => {
              const daysLeft = getDaysUntilDeadline(project.deadline)
              const isOverdue = daysLeft < 0
              const isDueSoon = daysLeft <= 3 && daysLeft >= 0

              return (
                <div key={project.id} className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600">
                        {project.tasksCompleted} of {project.totalTasks} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={project.status === "completed" ? "default" : "secondary"}
                        className={project.status === "completed" ? "bg-green-100 text-green-800" : ""}
                      >
                        {project.status}
                      </Badge>
                      <p
                        className={`text-sm mt-1 ${
                          isOverdue ? "text-red-600" : isDueSoon ? "text-orange-600" : "text-gray-600"
                        }`}
                      >
                        {isOverdue
                          ? `${Math.abs(daysLeft)} days overdue`
                          : daysLeft === 0
                            ? "Due today"
                            : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tasks that need attention soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDashboardData.upcomingDeadlines.map((task) => {
              const daysLeft = getDaysUntilDeadline(task.deadline)
              const isOverdue = daysLeft < 0
              const isDueSoon = daysLeft <= 3

              return (
                <div key={task.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h5>
                      <p className="text-xs text-gray-600">{task.project}</p>
                    </div>
                    <Badge className={priorityColors[task.priority]} variant="secondary">
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {task.assignee
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{task.assignee}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span
                        className={`text-xs ${
                          isOverdue
                            ? "text-red-600 font-medium"
                            : isDueSoon
                              ? "text-orange-600 font-medium"
                              : "text-gray-600"
                        }`}
                      >
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            <Link href="/tasks">
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                <CheckSquare className="w-4 h-4" />
                View All Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-5 h-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDashboardData.recentActivity.map((activity) => {
                const IconComponent = activityIcons[activity.type] || Activity

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                        {activity.project && <span className="text-gray-600"> in {activity.project}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                  Team Performance
                </CardTitle>
                <CardDescription>Track your team's productivity</CardDescription>
              </div>
              <Link href="/team">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Users className="w-4 h-4" />
                  View Team
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDashboardData.teamPerformance.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">{member.tasksCompleted} completed</span>
                    <Badge variant="outline" className="text-xs">
                      {member.efficiency}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{member.tasksInProgress} in progress</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/projects">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-6 hover:shadow-sm transition-all bg-transparent"
              >
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Create Project</p>
                  <p className="text-sm text-gray-600">Start a new client project</p>
                </div>
              </Button>
            </Link>

            <Link href="/tasks">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-6 hover:shadow-sm transition-all bg-transparent"
              >
                <div className="p-2 bg-orange-100 rounded-lg mr-4">
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Add Task</p>
                  <p className="text-sm text-gray-600">Create a new task</p>
                </div>
              </Button>
            </Link>

            <Link href="/team">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-6 hover:shadow-sm transition-all bg-transparent"
              >
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Invite Member</p>
                  <p className="text-sm text-gray-600">Add team member</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
