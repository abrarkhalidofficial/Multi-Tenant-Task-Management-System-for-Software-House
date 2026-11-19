import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  // Add your existing tables here
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    tenantId: v.optional(v.id("tenants")),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("project_manager"),
        v.literal("team_lead"),
        v.literal("member"),
        v.literal("client")
      )
    ),
    isActive: v.optional(v.boolean()),
    authId: v.optional(v.string()),
    permissions: v.optional(v.any()),
    preferences: v.optional(
      v.object({
        theme: v.string(),
        notifications: v.object({
          email: v.boolean(),
          inApp: v.boolean(),
        }),
        defaultView: v.string(),
      })
    ),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_auth_id", ["authId"])
    .index("by_tenant_role", ["tenantId", "role"])
    .index("by_email_tenant", ["email", "tenantId"]),

  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    settings: v.optional(
      v.object({
        branding: v.any(),
        features: v.object({
          enableClientAccess: v.boolean(),
          enableTimeTracking: v.boolean(),
          enableFileAttachments: v.boolean(),
          maxFileSize: v.number(),
          maxStorageSize: v.number(),
        }),
      })
    ),
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_slug", ["slug"]),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    tenantId: v.id("tenants"),
    status: v.string(),
    priority: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    progress: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    tenantId: v.id("tenants"),
    assignedTo: v.optional(v.id("users")),
    status: v.string(),
    priority: v.string(),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_tenant", ["tenantId"]),

  activityLogs: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    details: v.any(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"]),

  notifications: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    isRead: v.boolean(),
    isArchived: v.boolean(),
    priority: v.string(),
    deliveryStatus: v.object({
      email: v.optional(v.string()),
      inApp: v.string(),
    }),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant", ["tenantId"])
    .index("by_type", ["type"]),

  comments: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    tenantId: v.id("tenants"),
    entityType: v.string(),
    entityId: v.string(),
    parentId: v.optional(v.id("comments")),
    isEdited: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_author", ["authorId"])
    .index("by_tenant", ["tenantId"]),

  files: defineTable({
    name: v.string(),
    size: v.number(),
    type: v.string(),
    url: v.string(),
    uploadedBy: v.id("users"),
    tenantId: v.id("tenants"),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_tenant", ["tenantId"])
    .index("by_entity", ["entityType", "entityId"]),
});

export default schema;
