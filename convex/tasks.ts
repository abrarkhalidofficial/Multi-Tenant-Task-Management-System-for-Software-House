import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      tenantId: args.tenantId,
      boardId: args.boardId,
      columnId: args.columnId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      label: args.label,
      assignee: args.assignee,
      dueDate: args.dueDate,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
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
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const currentTask = await ctx.db.get(id);
    if (!currentTask) {
      throw new Error("Task not found");
    }

    if (currentTask.status !== args.status) {
      const columns = await ctx.db
        .query("columns")
        .withIndex("by_board", (q) => q.eq("boardId", currentTask.boardId))
        .collect();

      const newColumn = columns.find(
        (col) =>
          col.title.toLowerCase().includes(args.status) ||
          col._id === args.status
      );

      if (newColumn) {
        (updates as any).columnId = newColumn._id;
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const moveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    newColumnId: v.id("columns"),
    newStatus: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      columnId: args.newColumnId,
      status: args.newStatus,
      updatedAt: new Date().toISOString(),
    });
  },
});
