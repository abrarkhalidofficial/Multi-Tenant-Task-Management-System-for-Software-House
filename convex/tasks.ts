import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  requirePermission,
  requireTaskAccess,
  requireProjectAccess,
} from "./middleware";

// Get tasks for a project
export const getTasks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get assignees
    const assigneeIds = [
      ...new Set(tasks.map((t) => t.assigneeId).filter(Boolean)),
    ];
    const assignees = await Promise.all(
      assigneeIds.map((id) => ctx.db.get(id!))
    );
    const assigneesMap = new Map(
      assignees.filter(Boolean).map((a) => [a!._id, a])
    );

    return tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee:
        task.assigneeId && assigneesMap.get(task.assigneeId)
          ? {
              id: assigneesMap.get(task.assigneeId)!._id,
              name: assigneesMap.get(task.assigneeId)!.name,
              email: assigneesMap.get(task.assigneeId)!.email,
            }
          : null,
      deadline: task.deadline,
      startDate: task.startDate,
      completedAt: task.completedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      tags: task.tags,
      order: task.order,
      isAllDay: task.isAllDay,
      parentTaskId: task.parentTaskId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  },
});

// Get a specific task
export const getTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task, project } = await requireTaskAccess(ctx, args.taskId);

    // Get assignee
    const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;

    // Get created by user
    const createdBy = await ctx.db.get(task.createdById);

    return {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      assignee: assignee
        ? {
            id: assignee._id,
            name: assignee.name,
            email: assignee.email,
          }
        : null,
      createdBy: createdBy
        ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email,
          }
        : null,
      deadline: task.deadline,
      startDate: task.startDate,
      completedAt: task.completedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      tags: task.tags,
      attachments: task.attachments,
      checklist: task.checklist,
      customFields: task.customFields,
      order: task.order,
      isAllDay: task.isAllDay,
      recurrence: task.recurrence,
      parentTaskId: task.parentTaskId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assigneeId: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    parentTaskId: v.optional(v.id("tasks")),
    customFields: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(
            v.literal("text"),
            v.literal("number"),
            v.literal("date"),
            v.literal("select"),
            v.literal("checkbox")
          ),
          value: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    // Validate assignee if provided
    if (args.assigneeId) {
      const assignee = await ctx.db.get(args.assigneeId);
      if (!assignee || assignee.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid assignee");
      }
    }

    // Validate parent task if provided
    if (args.parentTaskId) {
      const parentTask = await ctx.db.get(args.parentTaskId);
      if (!parentTask || parentTask.projectId !== args.projectId) {
        throw new ConvexError("Invalid parent task");
      }
    }

    // Get the highest order for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxOrder =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.order || 0)) : 0;

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "todo",
      priority: args.priority,
      projectId: args.projectId,
      tenantId: user.tenantId,
      assigneeId: args.assigneeId,
      createdById: user._id,
      deadline: args.deadline,
      startDate: args.startDate,
      estimatedHours: args.estimatedHours,
      tags: args.tags || [],
      attachments: [],
      checklist: [],
      customFields: args.customFields || [],
      order: maxOrder + 1,
      parentTaskId: args.parentTaskId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "task",
      entityId: taskId,
      projectId: args.projectId,
      action: "created",
      details: {
        description: `${user.name} created task "${args.title}"`,
      },
      createdAt: Date.now(),
    });

    return {
      taskId,
      message: `Task "${args.title}" created successfully`,
    };
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
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
    assigneeId: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(
            v.literal("text"),
            v.literal("number"),
            v.literal("date"),
            v.literal("select"),
            v.literal("checkbox")
          ),
          value: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user, task, project } = await requireTaskAccess(ctx, args.taskId);

    // Validate assignee if provided
    if (args.assigneeId) {
      const assignee = await ctx.db.get(args.assigneeId);
      if (!assignee || assignee.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid assignee");
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Track status change for activity log
    const oldStatus = task.status;
    let newStatus = oldStatus;

    // Only include fields that are provided
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) {
      updates.status = args.status;
      newStatus = args.status;
      if (args.status === "done" && !task.completedAt) {
        updates.completedAt = Date.now();
      }
    }
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assigneeId !== undefined) updates.assigneeId = args.assigneeId;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.estimatedHours !== undefined)
      updates.estimatedHours = args.estimatedHours;
    if (args.actualHours !== undefined) updates.actualHours = args.actualHours;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.customFields !== undefined)
      updates.customFields = args.customFields;

    await ctx.db.patch(args.taskId, updates);

    // Create activity log
    let action = "updated";
    let description = `${user.name} updated task "${task.title}"`;

    if (oldStatus !== newStatus) {
      action = newStatus === "done" ? "completed" : "updated";
      description = `${user.name} ${
        newStatus === "done" ? "completed" : "changed status of"
      } task "${task.title}" to ${newStatus}`;
    }

    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      projectId: task.projectId,
      action,
      details: {
        description,
        field: oldStatus !== newStatus ? "status" : undefined,
        oldValue: oldStatus !== newStatus ? oldStatus : undefined,
        newValue: oldStatus !== newStatus ? newStatus : undefined,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Task updated successfully" };
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task, project } = await requireTaskAccess(ctx, args.taskId);

    // Check if task has subtasks
    const subtasks = await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();

    if (subtasks.length > 0) {
      throw new ConvexError(
        "Cannot delete task with subtasks. Delete subtasks first."
      );
    }

    await ctx.db.delete(args.taskId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      projectId: task.projectId,
      action: "deleted",
      details: {
        description: `${user.name} deleted task "${task.title}"`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Task deleted successfully" };
  },
});

// Update task order (for Kanban drag and drop)
export const updateTaskOrder = mutation({
  args: {
    taskId: v.id("tasks"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    await ctx.db.patch(args.taskId, {
      order: args.newOrder,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Add checklist item to task
export const addChecklistItem = mutation({
  args: {
    taskId: v.id("tasks"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const newItem = {
      id: Math.random().toString(36).substring(2, 15),
      text: args.text,
      completed: false,
    };

    const updatedChecklist = [...(task.checklist || []), newItem];

    await ctx.db.patch(args.taskId, {
      checklist: updatedChecklist,
      updatedAt: Date.now(),
    });

    return { success: true, itemId: newItem.id };
  },
});

// Update checklist item
export const updateChecklistItem = mutation({
  args: {
    taskId: v.id("tasks"),
    itemId: v.string(),
    text: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const updatedChecklist = (task.checklist || []).map((item) => {
      if (item.id === args.itemId) {
        return {
          ...item,
          text: args.text !== undefined ? args.text : item.text,
          completed:
            args.completed !== undefined ? args.completed : item.completed,
          completedAt: args.completed ? Date.now() : item.completedAt,
          completedBy: args.completed ? user._id : item.completedBy,
        };
      }
      return item;
    });

    await ctx.db.patch(args.taskId, {
      checklist: updatedChecklist,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete checklist item
export const deleteChecklistItem = mutation({
  args: {
    taskId: v.id("tasks"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const updatedChecklist = (task.checklist || []).filter(
      (item) => item.id !== args.itemId
    );

    await ctx.db.patch(args.taskId, {
      checklist: updatedChecklist,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get subtasks for a task
export const getSubtasks = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const subtasks = await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();

    // Get assignees
    const assigneeIds = [
      ...new Set(subtasks.map((t) => t.assigneeId).filter(Boolean)),
    ];
    const assignees = await Promise.all(
      assigneeIds.map((id) => ctx.db.get(id!))
    );
    const assigneesMap = new Map(
      assignees.filter(Boolean).map((a) => [a!._id, a])
    );

    return subtasks.map((subtask) => ({
      id: subtask._id,
      title: subtask.title,
      description: subtask.description,
      status: subtask.status,
      priority: subtask.priority,
      assignee:
        subtask.assigneeId && assigneesMap.get(subtask.assigneeId)
          ? {
              id: assigneesMap.get(subtask.assigneeId)!._id,
              name: assigneesMap.get(subtask.assigneeId)!.name,
              email: assigneesMap.get(subtask.assigneeId)!.email,
            }
          : null,
      deadline: subtask.deadline,
      completedAt: subtask.completedAt,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt,
    }));
  },
});
