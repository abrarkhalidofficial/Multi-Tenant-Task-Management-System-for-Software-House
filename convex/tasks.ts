import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  hasPermission,
  getNextTaskStatus,
  isOverdue,
  getTaskStatusColor,
  getPriorityColor,
  sanitizeContent,
} from "./utils";
import { Task, User, Project } from "./utils";

/**
 * Get task by ID
 */
export const getTask = query({
  args: {
    taskId: v.id("tasks"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions - users can read tasks in their tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access tasks from other tenants");
    }

    // Get project details
    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get reporter details
    const reporter = await ctx.db.get(task.reporterId);

    // Get assignee details
    const assignees = await Promise.all(
      task.assigneeIds.map((assigneeId) => ctx.db.get(assigneeId))
    );

    return {
      id: task._id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      project: {
        id: project._id,
        name: project.name,
      },
      assignees: assignees.filter(Boolean).map((assignee) => ({
        id: assignee._id,
        name: assignee.name,
        email: assignee.email,
        avatar: assignee.avatar,
      })),
      reporter: reporter
        ? {
            id: reporter._id,
            name: reporter.name,
            email: reporter.email,
            avatar: reporter.avatar,
          }
        : null,
      dueDate: task.dueDate,
      startDate: task.startDate,
      completedAt: task.completedAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      tags: task.tags,
      attachments: task.attachments,
      subtasks: task.subtasks,
      isArchived: task.isArchived,
      isOverdue: task.dueDate ? isOverdue(task.dueDate) : false,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  },
});

/**
 * Get all tasks for current tenant
 */
export const getTasks = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("projects")),
    assigneeId: v.optional(v.id("users")),
    reporterId: v.optional(v.id("users")),
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
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    includeOverdue: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    const tenantId = currentUser.tenantId;
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get tasks based on filters
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    // Apply filters
    if (args.projectId) {
      tasks = tasks.filter((task) => task.projectId === args.projectId);
    }

    if (args.assigneeId) {
      tasks = tasks.filter((task) =>
        task.assigneeIds.includes(args.assigneeId)
      );
    }

    if (args.reporterId) {
      tasks = tasks.filter((task) => task.reporterId === args.reporterId);
    }

    if (args.status) {
      tasks = tasks.filter((task) => task.status === args.status);
    }

    if (args.priority) {
      tasks = tasks.filter((task) => task.priority === args.priority);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower))
      );
    }

    if (!args.includeArchived) {
      tasks = tasks.filter((task) => !task.isArchived);
    }

    if (args.includeOverdue) {
      const now = Date.now();
      tasks = tasks.filter(
        (task) => task.dueDate && task.dueDate < now && task.status !== "done"
      );
    }

    // Get additional data for each task
    const tasksWithData = await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        const reporter = await ctx.db.get(task.reporterId);
        const assignees = await Promise.all(
          task.assigneeIds.map((assigneeId) => ctx.db.get(assigneeId))
        );

        return {
          id: task._id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: project
            ? {
                id: project._id,
                name: project.name,
              }
            : null,
          assignees: assignees.filter(Boolean).map((assignee) => ({
            id: assignee._id,
            name: assignee.name,
            email: assignee.email,
            avatar: assignee.avatar,
          })),
          reporter: reporter
            ? {
                id: reporter._id,
                name: reporter.name,
                email: reporter.email,
                avatar: reporter.avatar,
              }
            : null,
          dueDate: task.dueDate,
          startDate: task.startDate,
          completedAt: task.completedAt,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          tags: task.tags,
          attachments: task.attachments,
          subtasks: task.subtasks,
          isArchived: task.isArchived,
          isOverdue: task.dueDate ? isOverdue(task.dueDate) : false,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      })
    );

    const total = tasksWithData.length;
    const paginatedTasks = tasksWithData.slice(offset, offset + limit);

    return {
      tasks: paginatedTasks,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Create new task
 */
export const createTask = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assigneeIds: v.optional(v.array(v.id("users"))),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    if (!hasPermission(currentUser.role, "task", "create")) {
      throw new Error("Insufficient permissions");
    }

    // Ensure project belongs to user's tenant
    if (project.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot create tasks in projects from other tenants");
    }

    // Validate assignees
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      const assignees = await Promise.all(
        args.assigneeIds.map((assigneeId) => ctx.db.get(assigneeId))
      );

      const invalidAssignees = assignees.filter(
        (assignee) => !assignee || assignee.tenantId !== currentUser.tenantId
      );

      if (invalidAssignees.length > 0) {
        throw new Error("Invalid assignee IDs");
      }
    }

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      tenantId: currentUser.tenantId,
      projectId: args.projectId,
      name: sanitizeContent(args.name),
      description: args.description
        ? sanitizeContent(args.description)
        : undefined,
      status: "todo",
      priority: args.priority || "medium",
      assigneeIds: args.assigneeIds || [],
      reporterId: currentUser._id,
      dueDate: args.dueDate,
      startDate: args.startDate,
      completedAt: undefined,
      estimatedHours: args.estimatedHours,
      actualHours: undefined,
      tags: args.tags || [],
      attachments: [],
      subtasks: args.subtasks || [],
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notifications for assignees
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      for (const assigneeId of args.assigneeIds) {
        await ctx.db.insert("notifications", {
          tenantId: currentUser.tenantId,
          userId: assigneeId,
          type: "task_assigned",
          title: "New task assigned",
          message: `You have been assigned to task "${args.name}" in project "${project.name}"`,
          data: {
            taskId,
            projectId: args.projectId,
            senderId: currentUser._id,
          },
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "created_task",
      resourceType: "task",
      resourceId: taskId.toString(),
      changes: {
        before: null,
        after: { name: args.name, projectId: args.projectId },
      },
      createdAt: Date.now(),
    });

    return {
      taskId,
      success: true,
    };
  },
});

/**
 * Update task
 */
export const updateTask = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
    name: v.optional(v.string()),
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
    assigneeIds: v.optional(v.array(v.id("users"))),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions
    const isAssignee = task.assigneeIds.includes(
      currentUser._id as Id<"users">
    );
    const isReporter = task.reporterId === currentUser._id;
    const canUpdate = hasPermission(
      currentUser.role,
      "task",
      "update",
      false,
      isAssignee
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Ensure task belongs to user's tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot update tasks from other tenants");
    }

    // Validate assignees
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      const assignees = await Promise.all(
        args.assigneeIds.map((assigneeId) => ctx.db.get(assigneeId))
      );

      const invalidAssignees = assignees.filter(
        (assignee) => !assignee || assignee.tenantId !== currentUser.tenantId
      );

      if (invalidAssignees.length > 0) {
        throw new Error("Invalid assignee IDs");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = sanitizeContent(args.name);
    if (args.description !== undefined)
      updateData.description = args.description
        ? sanitizeContent(args.description)
        : undefined;
    if (args.status) {
      updateData.status = args.status;
      if (args.status === "done") {
        updateData.completedAt = Date.now();
      }
    }
    if (args.priority) updateData.priority = args.priority;
    if (args.assigneeIds !== undefined)
      updateData.assigneeIds = args.assigneeIds;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.estimatedHours !== undefined)
      updateData.estimatedHours = args.estimatedHours;
    if (args.actualHours !== undefined)
      updateData.actualHours = args.actualHours;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.subtasks !== undefined) updateData.subtasks = args.subtasks;

    await ctx.db.patch(args.taskId, updateData);

    // Create notifications for status changes
    if (args.status === "done") {
      // Notify reporter that task is completed
      if (task.reporterId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          tenantId: currentUser.tenantId,
          userId: task.reporterId,
          type: "task_completed",
          title: "Task completed",
          message: `Task "${task.name}" has been completed`,
          data: {
            taskId: args.taskId,
            projectId: task.projectId,
            completerId: currentUser._id,
          },
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "updated_task",
      resourceType: "task",
      resourceId: args.taskId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete task
 */
export const deleteTask = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions
    const isReporter = task.reporterId === currentUser._id;
    const canDelete = hasPermission(
      currentUser.role,
      "task",
      "delete",
      isReporter
    );

    if (!canDelete) {
      throw new Error("Insufficient permissions");
    }

    // Ensure task belongs to user's tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot delete tasks from other tenants");
    }

    // Delete task
    await ctx.db.delete(args.taskId);

    // Delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "deleted_task",
      resourceType: "task",
      resourceId: args.taskId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get tasks by status
 */
export const getTasksByStatus = query({
  args: {
    sessionToken: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get tasks by status
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();

    // Filter by project if provided
    if (args.projectId) {
      tasks = tasks.filter((task) => task.projectId === args.projectId);
    }

    // Get additional data for each task
    const tasksWithData = await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        const reporter = await ctx.db.get(task.reporterId);
        const assignees = await Promise.all(
          task.assigneeIds.map((assigneeId) => ctx.db.get(assigneeId))
        );

        return {
          id: task._id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: project
            ? {
                id: project._id,
                name: project.name,
              }
            : null,
          assignees: assignees.filter(Boolean).map((assignee) => ({
            id: assignee._id,
            name: assignee.name,
            email: assignee.email,
            avatar: assignee.avatar,
          })),
          reporter: reporter
            ? {
                id: reporter._id,
                name: reporter.name,
                email: reporter.email,
                avatar: reporter.avatar,
              }
            : null,
          dueDate: task.dueDate,
          startDate: task.startDate,
          completedAt: task.completedAt,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          tags: task.tags,
          attachments: task.attachments,
          subtasks: task.subtasks,
          isArchived: task.isArchived,
          isOverdue: task.dueDate ? isOverdue(task.dueDate) : false,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      })
    );

    return tasksWithData;
  },
});

/**
 * Get user's assigned tasks
 */
export const getMyTasks = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
    includeOverdue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get tasks assigned to current user
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect();

    // Filter tasks where user is assignee
    tasks = tasks.filter((task) =>
      task.assigneeIds.includes(currentUser._id as Id<"users">)
    );

    // Apply additional filters
    if (args.status) {
      tasks = tasks.filter((task) => task.status === args.status);
    }

    if (args.includeOverdue) {
      const now = Date.now();
      tasks = tasks.filter(
        (task) => task.dueDate && task.dueDate < now && task.status !== "done"
      );
    }

    // Filter out archived tasks
    tasks = tasks.filter((task) => !task.isArchived);

    // Get additional data for each task
    const tasksWithData = await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        const reporter = await ctx.db.get(task.reporterId);

        return {
          id: task._id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: project
            ? {
                id: project._id,
                name: project.name,
              }
            : null,
          reporter: reporter
            ? {
                id: reporter._id,
                name: reporter.name,
                email: reporter.email,
                avatar: reporter.avatar,
              }
            : null,
          dueDate: task.dueDate,
          startDate: task.startDate,
          completedAt: task.completedAt,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          tags: task.tags,
          attachments: task.attachments,
          subtasks: task.subtasks,
          isArchived: task.isArchived,
          isOverdue: task.dueDate ? isOverdue(task.dueDate) : false,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      })
    );

    return tasksWithData;
  },
});

/**
 * Move task to next status
 */
export const moveTaskToNextStatus = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions
    const isAssignee = task.assigneeIds.includes(
      currentUser._id as Id<"users">
    );
    const canUpdate = hasPermission(
      currentUser.role,
      "task",
      "update",
      false,
      isAssignee
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Ensure task belongs to user's tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot update tasks from other tenants");
    }

    // Get next status
    const nextStatus = getNextTaskStatus(task.status);
    if (!nextStatus) {
      throw new Error("Task is already in final status");
    }

    const updateData: any = {
      status: nextStatus,
      updatedAt: Date.now(),
    };

    if (nextStatus === "done") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(args.taskId, updateData);

    // Create notifications for status changes
    if (nextStatus === "done") {
      // Notify reporter that task is completed
      if (task.reporterId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          tenantId: currentUser.tenantId,
          userId: task.reporterId,
          type: "task_completed",
          title: "Task completed",
          message: `Task "${task.name}" has been completed`,
          data: {
            taskId: args.taskId,
            projectId: task.projectId,
            senderId: currentUser._id,
          },
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "moved_task_status",
      resourceType: "task",
      resourceId: args.taskId.toString(),
      changes: {
        before: { status: task.status },
        after: { status: nextStatus },
      },
      createdAt: Date.now(),
    });

    return {
      success: true,
      newStatus: nextStatus,
    };
  },
});

/**
 * Add comment to task
 */
export const addTaskComment = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions - anyone can comment on tasks in their tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot comment on tasks from other tenants");
    }

    // Validate mentions
    if (args.mentions && args.mentions.length > 0) {
      const mentionedUsers = await Promise.all(
        args.mentions.map((userId) => ctx.db.get(userId))
      );

      const invalidMentions = mentionedUsers.filter(
        (user) => !user || user.tenantId !== currentUser.tenantId
      );

      if (invalidMentions.length > 0) {
        throw new Error("Invalid user mentions");
      }
    }

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      tenantId: currentUser.tenantId,
      taskId: args.taskId,
      projectId: task.projectId,
      authorId: currentUser._id,
      content: sanitizeContent(args.content),
      mentions: args.mentions || [],
      attachments: [],
      isEdited: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notifications for mentions
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        if (mentionedUserId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            tenantId: currentUser.tenantId,
            userId: mentionedUserId,
            type: "mention",
            title: "You were mentioned",
            message: `${currentUser.name} mentioned you in a comment on task "${task.name}"`,
            data: {
              commentId,
              taskId: args.taskId,
              projectId: task.projectId,
              authorId: currentUser._id,
            },
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "added_comment",
      resourceType: "comment",
      resourceId: commentId.toString(),
      changes: {
        before: null,
        after: { taskId: args.taskId, content: args.content },
      },
      createdAt: Date.now(),
    });

    return {
      commentId,
      success: true,
    };
  },
});

/**
 * Get task comments
 */
export const getTaskComments = query({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get task
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions - users can read comments on tasks in their tenant
    if (task.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access comments from other tenants");
    }

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Get comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Sort by creation date (newest first)
    comments.sort((a, b) => b.createdAt - a.createdAt);

    const total = comments.length;
    const paginatedComments = comments.slice(offset, offset + limit);

    // Get author details for each comment
    const commentsWithAuthors = await Promise.all(
      paginatedComments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);

        return {
          id: comment._id,
          content: comment.content,
          author: author
            ? {
                id: author._id,
                name: author.name,
                email: author.email,
                avatar: author.avatar,
              }
            : null,
          mentions: comment.mentions,
          attachments: comment.attachments,
          isEdited: comment.isEdited,
          editedAt: comment.editedAt,
          createdAt: comment.createdAt,
        };
      })
    );

    return {
      comments: commentsWithAuthors,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Get task statistics
 */
export const getTaskStats = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get tasks
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect();

    // Filter by project if provided
    if (args.projectId) {
      tasks = tasks.filter((task) => task.projectId === args.projectId);
    }

    // Filter out archived tasks
    tasks = tasks.filter((task) => !task.isArchived);

    // Calculate statistics
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((task) => task.status === "todo").length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const reviewTasks = tasks.filter((task) => task.status === "review").length;
    const doneTasks = tasks.filter((task) => task.status === "done").length;

    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate && task.dueDate < Date.now() && task.status !== "done"
    ).length;

    const tasksWithDueDate = tasks.filter((task) => task.dueDate);
    const avgCompletionTime =
      tasksWithDueDate.length > 0
        ? tasksWithDueDate.reduce((sum, task) => {
            if (task.completedAt && task.startDate) {
              return sum + (task.completedAt - task.startDate);
            }
            return sum;
          }, 0) / tasksWithDueDate.length
        : 0;

    return {
      total: totalTasks,
      byStatus: {
        todo: todoTasks,
        in_progress: inProgressTasks,
        review: reviewTasks,
        done: doneTasks,
      },
      overdue: overdueTasks,
      completionRate:
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60)), // Convert to hours
    };
  },
});

/**
 * Bulk update task status
 */
export const bulkUpdateTaskStatus = mutation({
  args: {
    sessionToken: v.string(),
    taskIds: v.array(v.id("tasks")),
    newStatus: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    let updatedCount = 0;

    for (const taskId of args.taskIds) {
      // Get task
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      // Check permissions
      const isAssignee = task.assigneeIds.includes(currentUser._id);
      const canUpdate = hasPermission(
        currentUser.role,
        "task",
        "update",
        false,
        isAssignee
      );

      if (!canUpdate) continue;

      // Ensure task belongs to user's tenant
      if (task.tenantId !== currentUser.tenantId) continue;

      // Update task
      const updateData: any = {
        status: args.newStatus,
        updatedAt: Date.now(),
      };

      if (args.newStatus === "done") {
        updateData.completedAt = Date.now();
      }

      await ctx.db.patch(taskId, updateData);
      updatedCount++;
    }

    return {
      success: true,
      updatedCount,
    };
  },
});
