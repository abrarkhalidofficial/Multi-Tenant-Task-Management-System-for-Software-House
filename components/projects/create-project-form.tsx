"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, X, Calendar, Users } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import type { User } from "@/lib/types/database"

// Mock team members data
const mockTeamMembers: User[] = [
  {
    id: "user_2",
    tenantId: "tenant_1",
    email: "sarah@acme.com",
    name: "Sarah Wilson",
    role: "project_manager",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
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

interface CreateProjectFormProps {
  onSuccess: () => void
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [managerId, setManagerId] = useState("")
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [clientEmail, setClientEmail] = useState("")

  const projectManagers = mockTeamMembers.filter(
    (member) => member.role === "project_manager" || member.role === "admin",
  )

  const availableTeamMembers = mockTeamMembers.filter((member) => member.id !== managerId)

  const selectedTeamMembers = mockTeamMembers.filter((member) => selectedTeamIds.includes(member.id))

  const handleAddTeamMember = (memberId: string) => {
    if (!selectedTeamIds.includes(memberId)) {
      setSelectedTeamIds([...selectedTeamIds, memberId])
    }
  }

  const handleRemoveTeamMember = (memberId: string) => {
    setSelectedTeamIds(selectedTeamIds.filter((id) => id !== memberId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!title.trim()) {
        throw new Error("Project title is required")
      }

      if (!managerId) {
        throw new Error("Project manager is required")
      }

      // Mock API call - in real app, create project
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
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
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            placeholder="E-commerce Platform Redesign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the project goals, scope, and key deliverables..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="client-email">Client Email (Optional)</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="client@company.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Team Assignment */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manager">Project Manager *</Label>
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project manager" />
            </SelectTrigger>
            <SelectContent>
              {projectManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {manager.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{manager.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {manager.role.replace("_", " ")}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Team Members</Label>
          <Select onValueChange={handleAddTeamMember}>
            <SelectTrigger>
              <Users className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Add team members" />
            </SelectTrigger>
            <SelectContent>
              {availableTeamMembers
                .filter((member) => !selectedTeamIds.includes(member.id))
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

          {selectedTeamMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTeamMembers.map((member) => (
                <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTeamMember(member.id)}
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
          Create Project
        </Button>
      </div>
    </form>
  )
}
