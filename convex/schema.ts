import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // --- Convex Auth Tables (required for signIn / signUp to work) ---
  ...authTables,

  tenants: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly identifier
    logo: v.optional(v.string()),
    settings: v.optional(
      v.object({
        branding: v.optional(
          v.object({
            primaryColor: v.optional(v.string()),
            secondaryColor: v.optional(v.string()),
          })
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Users
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    tenantId: v.id("tenants"),
    role: v.union(
      v.literal("admin"),
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_role", ["tenantId", "role"])
    .index("by_role", ["role"]),

  // User Credentials (for password storage)
  userCredentials: defineTable({
    userId: v.id("users"),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_password", ["userId", "passwordHash"]),

  // Projects
  projects: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("archived")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    tenantId: v.id("tenants"),
    managerId: v.id("users"), // Project Manager
    teamMembers: v.array(v.id("users")),
    clientId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_manager", ["managerId"])
    .index("by_status", ["status"])
    .index("by_tenant_status", ["tenantId", "status"]),

  // Tasks
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    projectId: v.id("projects"),
    tenantId: v.id("tenants"),
    assigneeId: v.optional(v.id("users")),
    createdById: v.id("users"),
    parentTaskId: v.optional(v.id("tasks")), // For subtasks
    deadline: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    checklist: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_tenant", ["tenantId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_status", ["status"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_parent", ["parentTaskId"]),

  // Task Comments
  taskComments: defineTable({
    taskId: v.id("tasks"),
    tenantId: v.id("tenants"),
    authorId: v.id("users"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_tenant", ["tenantId"])
    .index("by_author", ["authorId"]),

  // Activity Logs
  activityLogs: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    entityType: v.union(
      v.literal("project"),
      v.literal("task"),
      v.literal("comment"),
      v.literal("user")
    ),
    entityId: v.string(),
    action: v.string(), // "created", "updated", "deleted", etc.
    details: v.optional(
      v.object({
        field: v.optional(v.string()),
        oldValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_tenant_created", ["tenantId", "createdAt"]),

  // Notifications
  notifications: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("task_commented"),
      v.literal("project_updated"),
      v.literal("mention")
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(
      v.union(v.literal("project"), v.literal("task"), v.literal("comment"))
    ),
    entityId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant", ["tenantId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_created", ["userId", "createdAt"]),
});
