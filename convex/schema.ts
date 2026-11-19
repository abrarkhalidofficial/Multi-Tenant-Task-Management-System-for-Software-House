import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    tenantId: v.string(),
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_tenant", ["tenantId"]),

  columns: defineTable({
    tenantId: v.string(),
    boardId: v.id("boards"),
    title: v.string(),
    order: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_tenant", ["tenantId"]),

  tasks: defineTable({
    tenantId: v.string(),
    boardId: v.id("boards"),
    columnId: v.id("columns"),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    label: v.string(),
    assignee: v.string(),
    dueDate: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_column", ["columnId"])
    .index("by_tenant", ["tenantId"]),

  activity: defineTable({
    tenantId: v.string(),
    boardId: v.id("boards"),
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("moved"),
      v.literal("deleted")
    ),
    taskTitle: v.string(),
    details: v.string(),
    timestamp: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_tenant", ["tenantId"]),
});
