import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// User roles as defined in the requirements
export const userRoles = [
  "admin",
  "project_manager",
  "team_lead",
  "member",
  "client",
] as const;

// Task statuses
export const taskStatuses = ["todo", "in_progress", "review", "done"] as const;

// Task priorities
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

// Project statuses
export const projectStatuses = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
] as const;

// Document types
export const documentTypes = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "jpg",
  "png",
  "mp4",
  "zip",
  "figma",
] as const;

// Message types
export const messageTypes = ["text", "image", "file"] as const;

// Message statuses
export const messageStatuses = ["sent", "delivered", "read"] as const;

// Notification types
export const notificationTypes = [
  "task_assigned",
  "task_completed",
  "comment_added",
  "project_updated",
  "mention",
] as const;

/**
 * Tenants represent software house organizations
 * Each tenant has isolated data and custom branding
 */
export const tenants = defineTable({
  name: v.string(),
  slug: v.string(), // Unique identifier for the tenant
  logo: v.optional(v.string()),
  theme: v.object({
    primaryColor: v.string(),
    secondaryColor: v.string(),
    fontFamily: v.string(),
  }),
  settings: v.object({
    maxUsers: v.number(),
    maxProjects: v.number(),
    maxStorage: v.number(), // in bytes
  }),
  subscription: v.object({
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled")
    ),
    expiresAt: v.optional(v.number()),
  }),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_active", ["isActive"]);

/**
 * Users within a tenant
 * Each user belongs to exactly one tenant
 */
export const users = defineTable({
  tenantId: v.id("tenants"),
  email: v.string(),
  name: v.string(),
  avatar: v.optional(v.string()),
  role: v.union(...userRoles.map((role) => v.literal(role))),
  workingHours: v.object({
    start: v.string(), // 24-hour format like "09:00"
    end: v.string(), // 24-hour format like "17:00"
    timezone: v.string(),
  }),
  team: v.optional(v.string()), // Reference to teams table
  isActive: v.boolean(),
  lastSeenAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_email", ["email"])
  .index("by_tenant_role", ["tenantId", "role"])
  .index("by_active", ["isActive"]);

/**
 * Teams within a tenant for organization structure
 */
export const teams = defineTable({
  tenantId: v.id("tenants"),
  name: v.string(),
  color: v.string(), // CSS color class
  description: v.optional(v.string()),
  leadId: v.optional(v.id("users")), // Team lead
  memberIds: v.array(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_lead", ["leadId"]);

/**
 * Projects within a tenant
 */
export const projects = defineTable({
  tenantId: v.id("tenants"),
  name: v.string(),
  description: v.optional(v.string()),
  status: v.union(...projectStatuses.map((status) => v.literal(status))),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  deadline: v.optional(v.number()),
  ownerId: v.id("users"), // Project manager
  teamId: v.optional(v.id("teams")),
  memberIds: v.array(v.id("users")),
  tags: v.array(v.string()),
  isArchived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_owner", ["ownerId"])
  .index("by_team", ["teamId"])
  .index("by_status", ["status"])
  .index("by_archived", ["isArchived"]);

/**
 * Tasks within projects
 */
export const tasks = defineTable({
  tenantId: v.id("tenants"),
  projectId: v.id("projects"),
  name: v.string(),
  description: v.optional(v.string()),
  status: v.union(...taskStatuses.map((status) => v.literal(status))),
  priority: v.union(...taskPriorities.map((priority) => v.literal(priority))),
  assigneeIds: v.array(v.id("users")),
  reporterId: v.id("users"), // Who created the task
  dueDate: v.optional(v.number()),
  startDate: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  estimatedHours: v.optional(v.number()),
  actualHours: v.optional(v.number()),
  tags: v.array(v.string()),
  attachments: v.array(
    v.object({
      name: v.string(),
      url: v.string(),
      size: v.number(),
      type: v.string(),
    })
  ),
  subtasks: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      completed: v.boolean(),
    })
  ),
  isArchived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_project", ["projectId"])
  .index("by_assignee", ["assigneeIds"])
  .index("by_reporter", ["reporterId"])
  .index("by_status", ["status"])
  .index("by_priority", ["priority"])
  .index("by_due_date", ["dueDate"])
  .index("by_archived", ["isArchived"]);

/**
 * Comments on tasks
 */
export const comments = defineTable({
  tenantId: v.id("tenants"),
  taskId: v.id("tasks"),
  projectId: v.id("projects"),
  authorId: v.id("users"),
  content: v.string(),
  mentions: v.array(v.id("users")),
  attachments: v.array(
    v.object({
      name: v.string(),
      url: v.string(),
      size: v.number(),
      type: v.string(),
    })
  ),
  isEdited: v.boolean(),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_task", ["taskId"])
  .index("by_project", ["projectId"])
  .index("by_author", ["authorId"]);

/**
 * Documents and files
 */
export const documents = defineTable({
  tenantId: v.id("tenants"),
  projectId: v.optional(v.id("projects")),
  taskId: v.optional(v.id("tasks")),
  name: v.string(),
  type: v.union(...documentTypes.map((type) => v.literal(type))),
  size: v.number(), // in bytes
  url: v.string(), // Storage URL
  ownerId: v.id("users"),
  folder: v.optional(v.string()),
  tags: v.array(v.string()),
  isStarred: v.boolean(),
  thumbnail: v.optional(v.string()),
  description: v.optional(v.string()),
  metadata: v.optional(
    v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      duration: v.optional(v.number()),
      pages: v.optional(v.number()),
    })
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_project", ["projectId"])
  .index("by_task", ["taskId"])
  .index("by_owner", ["ownerId"])
  .index("by_folder", ["folder"])
  .index("by_type", ["type"])
  .index("by_starred", ["isStarred"]);

/**
 * Chat conversations
 */
export const conversations = defineTable({
  tenantId: v.id("tenants"),
  projectId: v.optional(v.id("projects")),
  type: v.union(v.literal("individual"), v.literal("group")),
  name: v.optional(v.string()), // For group chats
  participantIds: v.array(v.id("users")),
  lastMessageId: v.optional(v.id("messages")),
  lastMessageAt: v.optional(v.number()),
  isArchived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_project", ["projectId"])
  .index("by_participants", ["participantIds"])
  .index("by_last_message", ["lastMessageAt"]);

/**
 * Chat messages
 */
export const messages = defineTable({
  tenantId: v.id("tenants"),
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  content: v.string(),
  type: v.union(...messageTypes.map((type) => v.literal(type))),
  status: v.union(...messageStatuses.map((status) => v.literal(status))),
  attachments: v.array(
    v.object({
      name: v.string(),
      url: v.string(),
      size: v.number(),
      type: v.string(),
    })
  ),
  mentions: v.array(v.id("users")),
  replyToId: v.optional(v.id("messages")),
  isEdited: v.boolean(),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_conversation", ["conversationId"])
  .index("by_sender", ["senderId"])
  .index("by_created", ["createdAt"]);

/**
 * Notifications for users
 */
export const notifications = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  type: v.union(...notificationTypes.map((type) => v.literal(type))),
  title: v.string(),
  message: v.string(),
  data: v.optional(
    v.object({
      projectId: v.optional(v.id("projects")),
      taskId: v.optional(v.id("tasks")),
      commentId: v.optional(v.id("comments")),
      conversationId: v.optional(v.id("conversations")),
      messageId: v.optional(v.id("messages")),
      senderId: v.optional(v.id("users")),
    })
  ),
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "isRead"])
  .index("by_created", ["createdAt"]);

/**
 * Activity logs for audit trail
 */
export const activityLogs = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  action: v.string(),
  resourceType: v.union(
    v.literal("project"),
    v.literal("task"),
    v.literal("comment"),
    v.literal("document"),
    v.literal("user"),
    v.literal("team")
  ),
  resourceId: v.string(),
  changes: v.optional(
    v.object({
      before: v.any(),
      after: v.any(),
    })
  ),
  metadata: v.optional(
    v.object({
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    })
  ),
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["userId"])
  .index("by_resource", ["resourceType", "resourceId"])
  .index("by_created", ["createdAt"]);

/**
 * User sessions for authentication
 */
export const sessions = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  token: v.string(),
  expiresAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  lastActivityAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["userId"])
  .index("by_token", ["token"])
  .index("by_expires", ["expiresAt"])
  .index("by_active", ["isActive"]);

/**
 * Project templates for quick project creation
 */
export const projectTemplates = defineTable({
  tenantId: v.id("tenants"),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  taskTemplates: v.array(
    v.object({
      name: v.string(),
      description: v.optional(v.string()),
      priority: v.union(
        ...taskPriorities.map((priority) => v.literal(priority))
      ),
      estimatedHours: v.optional(v.number()),
      assigneeRole: v.optional(
        v.union(...userRoles.map((role) => v.literal(role)))
      ),
    })
  ),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_category", ["category"])
  .index("by_active", ["isActive"]);

export default defineSchema({
  tenants,
  users,
  teams,
  projects,
  tasks,
  comments,
  documents,
  conversations,
  messages,
  notifications,
  activityLogs,
  sessions,
  projectTemplates,
});
