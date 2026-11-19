import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Tenants - Software house workspaces
  tenants: defineTable({
    name: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Users - Per-tenant users with roles
  users: defineTable({
    tenantId: v.id("tenants"),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("ProjectManager"),
      v.literal("TeamLead"),
      v.literal("Member"),
      v.literal("Client"),
    ),
    avatarUrl: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_email", ["tenantId", "email"]),

  // Projects - Client projects managed by software house
  projects: defineTable({
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("Planning"),
      v.literal("Active"),
      v.literal("OnHold"),
      v.literal("Completed"),
      v.literal("Archived"),
    ),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    managerId: v.id("users"), // Project Manager
    clientId: v.optional(v.id("users")), // Client user if applicable
    teamMembers: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_manager", ["managerId"]),

  // Tasks - Individual work items within projects
  tasks: defineTable({
    tenantId: v.id("tenants"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("ToDo"), v.literal("InProgress"), v.literal("Review"), v.literal("Done")),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    assignees: v.array(v.id("users")),
    createdBy: v.id("users"),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.array(v.string()),
    parentTaskId: v.optional(v.id("tasks")), // For subtasks
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_project", ["projectId"])
    .index("by_tenant_project", ["tenantId", "projectId"])
    .index("by_tenant_project_status", ["tenantId", "projectId", "status"])
    .index("by_assignees", ["assignees"])
    .index("by_status", ["status"])
    .index("by_parent", ["parentTaskId"]),

  // Comments - Task discussions and updates
  comments: defineTable({
    tenantId: v.id("tenants"),
    taskId: v.id("tasks"),
    authorId: v.id("users"),
    content: v.string(),
    mentions: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_tenant", ["tenantId"]),

  // Attachments - File metadata for tasks
  attachments: defineTable({
    tenantId: v.id("tenants"),
    taskId: v.id("tasks"),
    uploadedBy: v.id("users"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.optional(v.id("_storage")), // Convex file storage
    s3Key: v.optional(v.string()), // S3 fallback
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_tenant", ["tenantId"]),

  // Activity Logs - Audit trail for all actions
  activityLogs: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    action: v.string(), // "created_task", "updated_project", etc.
    entityType: v.union(v.literal("project"), v.literal("task"), v.literal("comment")),
    entityId: v.string(),
    details: v.object({
      before: v.optional(v.any()),
      after: v.optional(v.any()),
      metadata: v.optional(v.any()),
    }),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_user", ["userId"]),

  // Notifications - In-app notifications for users
  notifications: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("comment_mention"),
      v.literal("project_updated"),
      v.literal("deadline_approaching"),
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.union(v.literal("project"), v.literal("task"))),
    entityId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_tenant", ["tenantId"]),

  // Project Stats - Cached statistics for performance
  projectStats: defineTable({
    tenantId: v.id("tenants"),
    projectId: v.id("projects"),
    totalTasks: v.number(),
    completedTasks: v.number(),
    inProgressTasks: v.number(),
    overdueTasks: v.number(),
    completionRate: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_tenant", ["tenantId"]),

  // User Invitations - Pending invites to join tenant
  invitations: defineTable({
    tenantId: v.id("tenants"),
    email: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("ProjectManager"),
      v.literal("TeamLead"),
      v.literal("Member"),
      v.literal("Client"),
    ),
    invitedBy: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_tenant", ["tenantId"])
    .index("by_email", ["email"]),
})
