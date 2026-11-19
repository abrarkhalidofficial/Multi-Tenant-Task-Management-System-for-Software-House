import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    assigneeId: v.optional(v.id("users")),
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
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.tenantId !== currentUser.tenantId) {
      throw new Error("Project not found or access denied");
    }

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      tenantId: currentUser.tenantId,
      creatorId: currentUser._id,
      assigneeId: args.assigneeId,
      status: args.status,
      priority: args.priority,
      dueDate: args.dueDate,
      estimatedHours: args.estimatedHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

export const getTasksByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.tenantId !== currentUser.tenantId) {
      return [];
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.taskId;
  },
});

export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied");
    }

    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "project_manager" &&
      currentUser.role !== "team_lead"
    ) {
      throw new Error("Not authorized to assign tasks");
    }

    await ctx.db.patch(args.taskId, {
      assigneeId: args.assigneeId,
      updatedAt: Date.now(),
    });

    return args.taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied");
    }

    const { taskId, ...updates } = args;

    const oldAssignee = task.assigneeId;
    const newAssignee = updates.assigneeId;
    const oldStatus = task.status;
    const newStatus = updates.status;

    await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "task",
      entityId: taskId,
      action: "updated",
      details:
        updates.status && updates.status !== oldStatus
          ? {
              field: "status",
              oldValue: oldStatus,
              newValue: updates.status,
            }
          : undefined,
      createdAt: Date.now(),
    });

    if (
      newAssignee &&
      newAssignee !== oldAssignee &&
      newAssignee !== currentUser._id
    ) {
      await ctx.db.insert("notifications", {
        tenantId: currentUser.tenantId,
        userId: newAssignee,
        type: "task_assigned",
        title: "Task Assigned",
        message: `You have been assigned to task: ${task.title}`,
        entityType: "task",
        entityId: taskId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    if (
      newStatus &&
      newStatus !== oldStatus &&
      task.assigneeId &&
      task.assigneeId !== currentUser._id
    ) {
      await ctx.db.insert("notifications", {
        tenantId: currentUser.tenantId,
        userId: task.assigneeId,
        type: "task_updated",
        title: "Task Updated",
        message: `Task "${task.title}" status changed from ${oldStatus} to ${newStatus}`,
        entityType: "task",
        entityId: taskId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return taskId;
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied");
    }

    return task;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied");
    }

    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "project_manager" &&
      task.creatorId !== currentUser._id
    ) {
      throw new Error("Not authorized to delete this task");
    }

    await ctx.db.delete(args.taskId);
    return args.taskId;
  },
});
