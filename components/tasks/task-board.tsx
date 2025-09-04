"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { CreateTaskForm } from "./create-task-form"
import { TaskDetail } from "./task-detail"
import { useAuth } from "@/lib/auth/auth-context"
import type { Task, TaskStatus, TaskPriority } from "@/lib/types/database"

// Mock tasks data
const mockTasks: (Task & {
  assigneeNames: string[]
  creatorName: string
  commentCount: number
  attachmentCount: number
})[] = [
  {
    id: "task_1",
    tenantId: "tenant_1",
    projectId: "proj_1",
    title: "Design homepage mockups",
    description: "Create high-fidelity mockups for the new homepage design including mobile and desktop versions",
    status: "done",
    priority: "high",
    assigneeIds: ["user_4"],
    creatorId: "user_2",
    deadline: new Date("2024-01-25"),
    estimatedHours: 16,
    actualHours: 14,
    tags: ["design", "ui/ux"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-22"),
    assigneeNames: ["Alex Chen"],
    creatorName: "Sarah Wilson",
    commentCount: 3,
    attachmentCount: 2,
  },
  {
    id: "task_2",
    tenantId: "tenant_1",
    projectId: "proj_1",
    title: "Implement user authentication",
    description: "Set up secure user authentication system with JWT tokens and password hashing",
    status: "in_progress",
    priority: "high",
    assigneeIds: ["user_3"],
    creatorId: "user_2",
    deadline: new Date("2024-01-30"),
    estimatedHours: 24,
    tags: ["backend", "security"],
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-20"),
    assigneeNames: ["Mike Johnson"],
    creatorName: "Sarah Wilson",
    commentCount: 1,
    attachmentCount: 0,
  },
  {
    id: "task_3",
    tenantId: "tenant_1",
    projectId: "proj_1",
    title: "Setup database schema",
    description: "Design and implement the database schema for user data, products, and orders",
    status: "review",
    priority: "medium",
    assigneeIds: ["user_5"],
    creatorId: "user_2",
    deadline: new Date("2024-02-05"),
    estimatedHours: 12,
    tags: ["database", "backend"],
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-21"),
    assigneeNames: ["Emma Davis"],
    creatorName: "Sarah Wilson",
    commentCount: 2,
    attachmentCount: 1,
  },
  {
    id: "task_4",
    tenantId: "tenant_1",
    projectId: "proj_1",
    title: "Mobile responsive layout",
    description: "Ensure all pages are fully responsive and work well on mobile devices",
    status: "todo",
    priority: "medium",
    assigneeIds: ["user_4", "user_5"],
    creatorId: "user_3",
    deadline: new Date("2024-02-10"),
    estimatedHours: 20,
    tags: ["frontend", "responsive"],
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
    assigneeNames: ["Alex Chen", "Emma Davis"],
    creatorName: "Mike Johnson",
    commentCount: 0,
    attachmentCount: 0,
  },
]

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: "todo", title: "To Do", color: "bg-gray-100" },
  { status: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { status: "review", title: "Review", color: "bg-yellow-100" },
  { status: "done", title: "Done", color: "bg-green-100" },
]

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

interface TaskBoardProps {
  projectId?: string
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const { hasPermission } = useAuth()
  const [tasks, setTasks] = useState(mockTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const filteredTasks = tasks.filter((task) => {
    if (projectId && task.projectId !== projectId) return false

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === "all" || task.assigneeIds.includes(assigneeFilter)

    return matchesSearch && matchesPriority && matchesAssignee
  })

  const canCreateTask = hasPermission("manage_team_tasks") || hasPermission("manage_all_tasks")

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task)))
  }

  const formatDeadline = (deadline: Date) => {
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600" }
    if (diffDays === 0) return { text: "Due today", color: "text-orange-600" }
    if (diffDays <= 3) return { text: `${diffDays}d left`, color: "text-yellow-600" }
    return { text: `${diffDays}d left`, color: "text-gray-600" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600 mt-2">Manage tasks with Kanban-style workflow.</p>
        </div>

        {canCreateTask && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskForm projectId={projectId} onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="user_3">Mike Johnson</SelectItem>
            <SelectItem value="user_4">Alex Chen</SelectItem>
            <SelectItem value="user_5">Emma Davis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column.status)

          return (
            <div key={column.status} className="space-y-4">
              <div className={`p-3 rounded-lg ${column.color}`}>
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <p className="text-sm text-gray-600">{columnTasks.length} tasks</p>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {columnTasks.map((task) => {
                  const deadline = task.deadline ? formatDeadline(task.deadline) : null

                  return (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTask(task.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Badge className={priorityColors[task.priority]} variant="secondary">
                            {task.priority}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTask(task.id)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canCreateTask && (
                                <>
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {task.description && <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Assignees */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {task.assigneeNames.slice(0, 2).map((name, index) => (
                              <Avatar key={index} className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {task.assigneeNames.length > 2 && (
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-600">+{task.assigneeNames.length - 2}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {task.commentCount > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.commentCount}</span>
                              </div>
                            )}
                            {task.attachmentCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                <span>{task.attachmentCount}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Deadline */}
                        {deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs ${deadline.color}`}>{deadline.text}</span>
                          </div>
                        )}

                        {/* Status Change Buttons */}
                        <div className="flex gap-1 pt-2">
                          {column.status !== "todo" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                const prevStatus =
                                  statusColumns[statusColumns.findIndex((c) => c.status === column.status) - 1]?.status
                                if (prevStatus) handleStatusChange(task.id, prevStatus)
                              }}
                            >
                              ←
                            </Button>
                          )}
                          {column.status !== "done" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6 px-2 bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextStatus =
                                  statusColumns[statusColumns.findIndex((c) => c.status === column.status) + 1]?.status
                                if (nextStatus) handleStatusChange(task.id, nextStatus)
                              }}
                            >
                              →
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TaskDetail
              taskId={selectedTask}
              onClose={() => setSelectedTask(null)}
              onStatusChange={handleStatusChange}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
