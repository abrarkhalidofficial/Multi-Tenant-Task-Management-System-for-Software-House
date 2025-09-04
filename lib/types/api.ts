// API request/response types for the task management system

import type { User, TaskStatus, TaskPriority, ProjectStatus } from "./database"

// Authentication
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  tenantSlug?: string // For joining existing tenant
  tenantName?: string // For creating new tenant
}

export interface AuthResponse {
  user: User
  token: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

// Project Management
export interface CreateProjectRequest {
  title: string
  description?: string
  deadline?: string
  managerId: string
  teamIds: string[]
  clientId?: string
}

export interface UpdateProjectRequest {
  title?: string
  description?: string
  status?: ProjectStatus
  deadline?: string
  managerId?: string
  teamIds?: string[]
}

// Task Management
export interface CreateTaskRequest {
  projectId: string
  title: string
  description?: string
  priority: TaskPriority
  assigneeIds: string[]
  deadline?: string
  estimatedHours?: number
  parentTaskId?: string
  tags?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeIds?: string[]
  deadline?: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
}

// Comments
export interface CreateCommentRequest {
  taskId: string
  content: string
  mentions?: string[]
}

// Dashboard Data
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  teamMembers: number
}

export interface ProjectProgress {
  projectId: string
  projectName: string
  totalTasks: number
  completedTasks: number
  progressPercentage: number
  deadline?: Date
}

// Filters and Search
export interface TaskFilters {
  projectId?: string
  assigneeId?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  search?: string
}

export interface ProjectFilters {
  status?: ProjectStatus[]
  managerId?: string
  search?: string
}
