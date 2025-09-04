"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, X, Calendar, Users, Tag } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import type { TaskPriority, User } from "@/lib/types/database"

// Mock team members
const mockTeamMembers: User[] = [
  {
    id: "user_3",
    tenantId: "tenant_1",
    email: "mike@acme.com",
    name: "Mike Johnson",
    role: "team_lead",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user_4",
    tenantId: "tenant_1",
    email: "alex@acme.com",
    name: "Alex Chen",
    role: "member",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user_5",
    tenantId: "tenant_1",
    email: "emma@acme.com",
    name: "Emma Davis",
    role: "member",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

interface CreateTaskFormProps {
  projectId?: string
  onSuccess: () => void
}

export function CreateTaskForm({ projectId, onSuccess }: CreateTaskFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [deadline, setDeadline] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  const selectedAssignees = mockTeamMembers.filter((member) => selectedAssigneeIds.includes(member.id))

  const handleAddAssignee = (memberId: string) => {
    if (!selectedAssigneeIds.includes(memberId)) {
      setSelectedAssigneeIds([...selectedAssigneeIds, memberId])
    }
  }

  const handleRemoveAssignee = (memberId: string) => {
    setSelectedAssigneeIds(selectedAssigneeIds.filter((id) => id !== memberId))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!title.trim()) {
        throw new Error("Task title is required")
      }

      if (selectedAssigneeIds.length === 0) {
        throw new Error("At least one assignee is required")
      }

      // Mock API call - in real app, create task
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            placeholder="Implement user authentication"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the task requirements, acceptance criteria, and any important details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
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
            <Label htmlFor="deadline">Deadline</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated-hours">Estimated Hours</Label>
            <Input
              id="estimated-hours"
              type="number"
              placeholder="8"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </div>

      {/* Assignees */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Assignees *</Label>
          <Select onValueChange={handleAddAssignee}>
            <SelectTrigger>
              <Users className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Add assignees" />
            </SelectTrigger>
            <SelectContent>
              {mockTeamMembers
                .filter((member) => !selectedAssigneeIds.includes(member.id))
                .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.role.replace("_", " ")}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedAssignees.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAssignees.map((assignee) => (
                <Badge key={assignee.id} variant="secondary" className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs">
                      {assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{assignee.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveAssignee(assignee.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Add tag (e.g., frontend, backend, bug)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button type="button" onClick={handleAddTag} variant="outline">
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Task
        </Button>
      </div>
    </form>
  )
}
