"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Calendar, User, AlertCircle, Clock } from "lucide-react"
import { TaskDialog } from "./task-dialog"

interface KanbanBoardProps {
  projectId: Id<"projects">
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const tasks = useQuery(api.tasks.getTasksByProject, { projectId })
  const users = useQuery(api.users.getUsersByTenant, tasks?.[0]?.tenantId ? { tenantId: tasks[0].tenantId } : "skip")
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus)
  const [selectedTask, setSelectedTask] = useState<Id<"tasks"> | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const todoTasks = tasks?.filter((task) => task.status === "todo") || []
  const inProgressTasks = tasks?.filter((task) => task.status === "in_progress") || []
  const reviewTasks = tasks?.filter((task) => task.status === "review") || []
  const doneTasks = tasks?.filter((task) => task.status === "done") || []

  const columns = [
    { id: "todo", title: "To Do", tasks: todoTasks, color: "bg-gray-100" },
    { id: "in_progress", title: "In Progress", tasks: inProgressTasks, color: "bg-blue-100" },
    { id: "review", title: "Review", tasks: reviewTasks, color: "bg-yellow-100" },
    { id: "done", title: "Done", tasks: doneTasks, color: "bg-green-100" },
  ]

  const handleStatusChange = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await updateTaskStatus({
        taskId,
        status: newStatus as any,
      })
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleDateString()
  }

  const getUserById = (userId?: Id<"users">) => {
    return users?.find((user) => user._id === userId)
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <Card className={`${column.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  {column.title}
                  <Badge variant="secondary">{column.tasks.length}</Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="flex-1 space-y-3 mt-4 overflow-y-auto">
              {column.tasks.map((task) => {
                const assignee = getUserById(task.assigneeId)
                const isOverdue = task.dueDate && task.dueDate < Date.now()

                return (
                  <Card
                    key={task._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTask(task._id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {assignee && (
                              <div className="flex items-center space-x-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {assignee.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                            {!assignee && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="text-xs">Unassigned</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {task.dueDate && (
                              <div
                                className={`flex items-center space-x-1 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
                              >
                                {isOverdue && <AlertCircle className="h-3 w-3" />}
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs">{formatDate(task.dueDate)}</span>
                              </div>
                            )}
                            {task.estimatedHours && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">{task.estimatedHours}h</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick status change buttons */}
                        <div className="flex gap-1">
                          {columns
                            .filter((col) => col.id !== column.id)
                            .slice(0, 2)
                            .map((targetColumn) => (
                              <Button
                                key={targetColumn.id}
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2 bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(task._id, targetColumn.id)
                                }}
                              >
                                → {targetColumn.title}
                              </Button>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">No tasks in {column.title.toLowerCase()}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Dialog */}
      {selectedTask && (
        <TaskDialog
          taskId={selectedTask}
          projectId={projectId}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}

      {/* Create Task Dialog */}
      {isCreating && <TaskDialog projectId={projectId} open={isCreating} onOpenChange={setIsCreating} />}
    </div>
  )
}
