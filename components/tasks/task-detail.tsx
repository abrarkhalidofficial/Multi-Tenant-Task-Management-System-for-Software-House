"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, MessageSquare, Paperclip, Tag, Send, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import type { TaskStatus, TaskPriority } from "@/lib/types/database"

interface TaskDetailProps {
  taskId: string
  onClose: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

// Mock task detail data
const mockTaskDetail = {
  id: "task_1",
  title: "Design homepage mockups",
  description:
    "Create high-fidelity mockups for the new homepage design including mobile and desktop versions. The design should follow the brand guidelines and include all necessary components like navigation, hero section, features, and footer.",
  status: "in_progress" as TaskStatus,
  priority: "high" as TaskPriority,
  deadline: new Date("2024-01-25"),
  estimatedHours: 16,
  actualHours: 12,
  tags: ["design", "ui/ux", "homepage"],
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-22"),
  creator: {
    id: "user_2",
    name: "Sarah Wilson",
    avatar: "/placeholder.svg",
  },
  assignees: [{ id: "user_4", name: "Alex Chen", avatar: "/placeholder.svg" }],
  comments: [
    {
      id: "comment_1",
      author: { name: "Sarah Wilson", avatar: "/placeholder.svg" },
      content:
        "Great progress on the initial mockups! The hero section looks fantastic. Can you also include the mobile version?",
      createdAt: new Date("2024-01-20T10:30:00"),
    },
    {
      id: "comment_2",
      author: { name: "Alex Chen", avatar: "/placeholder.svg" },
      content: "Thanks! I'll have the mobile version ready by tomorrow. Should I also create variations for tablet?",
      createdAt: new Date("2024-01-20T14:15:00"),
    },
    {
      id: "comment_3",
      author: { name: "Mike Johnson", avatar: "/placeholder.svg" },
      content: "Yes, tablet variations would be great. Make sure to consider the navigation collapse behavior.",
      createdAt: new Date("2024-01-21T09:00:00"),
    },
  ],
  attachments: [
    { id: "att_1", name: "homepage-desktop-v1.fig", size: "2.4 MB", type: "figma" },
    { id: "att_2", name: "brand-guidelines.pdf", size: "1.8 MB", type: "pdf" },
  ],
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
}

export function TaskDetail({ taskId, onClose, onStatusChange }: TaskDetailProps) {
  const { user, hasPermission } = useAuth()
  const [task] = useState(mockTaskDetail)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const canEditTask =
    hasPermission("manage_all_tasks") ||
    (hasPermission("manage_team_tasks") && task.assignees.some((a) => a.id === user?.id))

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange(taskId, newStatus)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setNewComment("")
    setIsSubmittingComment(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
        </div>

        {canEditTask && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {comment.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment} size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments ({task.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{attachment.size}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-sm text-gray-600">{formatDate(task.deadline)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Time Tracking</p>
                  <p className="text-sm text-gray-600">
                    {task.actualHours}h / {task.estimatedHours}h estimated
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Created by</p>
                  <p className="text-sm text-gray-600">{task.creator.name}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Assignees</p>
                <div className="space-y-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {task.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-gray-500 space-y-1">
                <p>Created: {formatDateTime(task.createdAt)}</p>
                <p>Updated: {formatDateTime(task.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
