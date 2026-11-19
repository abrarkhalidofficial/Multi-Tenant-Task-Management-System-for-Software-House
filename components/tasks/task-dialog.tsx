"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Loader2, Trash2, MessageSquare, Send } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskDialogProps {
  taskId?: Id<"tasks">
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDialog({ taskId, projectId, open, onOpenChange }: TaskDialogProps) {
  const task = useQuery(api.tasks.getTask, taskId ? { taskId } : "skip")
  const currentUser = useQuery(api.users.getCurrentUser)
  const users = useQuery(
    api.users.getUsersByTenant,
    currentUser?.tenantId ? { tenantId: currentUser.tenantId } : "skip",
  )
  const comments = useQuery(api.comments.getCommentsByTask, taskId ? { taskId } : "skip")

  const createTask = useMutation(api.tasks.createTask)
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)
  const createComment = useMutation(api.comments.createComment)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    status: "todo" as const,
    priority: "medium" as const,
    estimatedHours: "",
  })
  const [dueDate, setDueDate] = useState<Date>()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditing = !!taskId

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours?.toString() || "",
      })
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
    } else {
      // Reset form for new task
      setFormData({
        title: "",
        description: "",
        assigneeId: "",
        status: "todo",
        priority: "medium",
        estimatedHours: "",
      })
      setDueDate(undefined)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        assigneeId: formData.assigneeId || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: dueDate?.getTime(),
        estimatedHours: formData.estimatedHours ? Number.parseFloat(formData.estimatedHours) : undefined,
      }

      if (isEditing && taskId) {
        await updateTask({ taskId, ...taskData })
      } else {
        await createTask({ projectId, ...taskData })
      }

      onOpenChange(false)
    } catch (err) {
      setError(`Failed to ${isEditing ? "update" : "create"} task. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!taskId) return

    setIsSubmitting(true)
    try {
      await deleteTask({ taskId })
      onOpenChange(false)
    } catch (err) {
      setError("Failed to delete task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (!taskId || !newComment.trim()) return

    try {
      await createComment({
        taskId,
        content: newComment.trim(),
      })
      setNewComment("")
    } catch (err) {
      setError("Failed to add comment. Please try again.")
    }
  }

  const assignee = users?.find((user) => user._id === formData.assigneeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update task details and track progress" : "Add a new task to your project"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Task Details</TabsTrigger>
            <TabsTrigger value="comments" disabled={!isEditing}>
              Comments {comments && comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the task requirements and acceptance criteria"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={formData.assigneeId}
                    onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    disabled={isSubmitting}
                  >
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground",
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <div>
                  {isEditing && (
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Task" : "Create Task"}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Label htmlFor="newComment">Add Comment</Label>
              <div className="flex gap-2">
                <Textarea
                  id="newComment"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3 p-3 bg-muted rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.author?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{comment.author?.name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                  <p>No comments yet. Be the first to add one!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
