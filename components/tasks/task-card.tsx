"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, User, AlertCircle, Clock } from "lucide-react"

interface TaskCardProps {
  task: {
    _id: string
    title: string
    description?: string
    priority: string
    dueDate?: number
    estimatedHours?: number
    assigneeId?: string
  }
  assignee?: {
    name: string
    email: string
  }
  onClick: () => void
}

export function TaskCard({ task, assignee, onClick }: TaskCardProps) {
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

  const isOverdue = task.dueDate && task.dueDate < Date.now()

  return (
    <div className="p-4 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
          <Badge className={getPriorityColor(task.priority)} variant="secondary">
            {task.priority}
          </Badge>
        </div>

        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {assignee && (
              <div className="flex items-center space-x-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
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
              <div className={`flex items-center space-x-1 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
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
      </div>
    </div>
  )
}
