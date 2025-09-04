// Multi-tenant task management system types and interfaces

export type UserRole = "admin" | "project_manager" | "team_lead" | "member" | "client"

export type TaskStatus = "todo" | "in_progress" | "review" | "done"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived"

// Tenant (Software House) Schema
export interface Tenant {
  id: string
  name: string
  slug: string // URL-friendly identifier
  logo?: string
  branding?: {
    primaryColor?: string
    secondaryColor?: string
  }
  settings?: {
    allowClientAccess?: boolean
    defaultTaskStatuses?: TaskStatus[]
  }
  createdAt: Date
  updatedAt: Date
}

// User Schema
export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Project Schema
export interface Project {
  id: string
  tenantId: string
  title: string
  description?: string
  status: ProjectStatus
  deadline?: Date
  managerId: string // User ID of project manager
  teamIds: string[] // Array of user IDs
  clientId?: string // Optional client user ID
  metadata?: {
    budget?: number
    estimatedHours?: number
  }
  createdAt: Date
  updatedAt: Date
}

// Task Schema
export interface Task {
  id: string
  tenantId: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeIds: string[] // Array of user IDs
  creatorId: string
  deadline?: Date
  estimatedHours?: number
  actualHours?: number
  parentTaskId?: string // For subtasks
  attachments?: string[] // File URLs
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

// Task Comment Schema
export interface TaskComment {
  id: string
  tenantId: string
  taskId: string
  authorId: string
  content: string
  mentions?: string[] // User IDs mentioned in comment
  createdAt: Date
  updatedAt: Date
}

// Activity Log Schema
export interface ActivityLog {
  id: string
  tenantId: string
  userId: string
  entityType: "project" | "task" | "user"
  entityId: string
  action: string
  details?: Record<string, any>
  createdAt: Date
}

// Notification Schema
export interface Notification {
  id: string
  tenantId: string
  userId: string
  type: "task_assigned" | "task_updated" | "comment_added" | "deadline_approaching" | "mention"
  title: string
  message: string
  isRead: boolean
  entityType?: "project" | "task"
  entityId?: string
  createdAt: Date
}

// Permission definitions
export const ROLE_PERMISSIONS = {
  admin: ["manage_tenant", "manage_users", "manage_all_projects", "manage_all_tasks", "view_reports"],
  project_manager: ["create_projects", "manage_assigned_projects", "assign_tasks", "view_team_reports"],
  team_lead: ["manage_team_tasks", "review_tasks", "comment_on_tasks"],
  member: ["view_assigned_tasks", "update_task_status", "comment_on_tasks"],
  client: ["view_assigned_projects", "comment_on_tasks"],
} as const

export type Permission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number]
