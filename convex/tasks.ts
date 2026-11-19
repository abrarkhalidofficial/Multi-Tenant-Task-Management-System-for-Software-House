// convex/functions/tasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a Task
 * Expects dueDate as milliseconds since epoch (number)
 */
export const addTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("review"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.number(),
    assignee: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description ?? "",
      status: args.status,
      priority: args.priority,
      dueDate: args.dueDate,
      assignee: args.assignee,
      projectId: args.projectId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    return taskId;
  },
});

/**
 * Update a full task (patch semantics)
 */
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("todo"),
          v.literal("in-progress"),
          v.literal("review"),
          v.literal("done")
        )
      ),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      dueDate: v.optional(v.number()),
      assignee: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    // Add updatedAt automatically
    await ctx.db.patch(args.taskId, {
      ...args.patch,
      updatedAt: now,
    });
  },
});

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

/**
 * Get all tasks (optionally by status)
 */
export const getTasks = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in-progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      priority: v.string(),
      dueDate: v.number(),
      assignee: v.string(),
      projectId: v.optional(v.id("projects")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    let q = ctx.db.query("tasks");
    if (args.status) {
      q = q.filter((q2) => q2.eq(q2.field("status"), args.status));
    }
    // Example: sort by dueDate ascending
    // Define Task interface
    interface Task {
      _id: v.Id<"tasks">;
      title: string;
      description?: string;
      status: string;
      priority: string;
      dueDate: number;
      assignee: string;
      projectId?: v.Id<"projects">;
      createdAt: number;
      updatedAt?: number;
    }

    const tasks: Task[] = await q
      .order("asc", (q2) => q2.field("dueDate"))
      .collect();
    return tasks;
  },
});

/**
 * Get tasks by project id
 */
export const getTasksByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
      description: v.string(),
      status: v.string(),
      priority: v.string(),
      dueDate: v.number(),
      assignee: v.string(),
      projectId: v.optional(v.id("projects")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .order("asc", (q) => q.field("dueDate"))
      .collect();
    return tasks;
  },
});
