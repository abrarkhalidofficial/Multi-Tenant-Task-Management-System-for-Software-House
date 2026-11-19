import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"
import { ConvexError } from "convex/values"

export const createTask = mutation({
  args: {
    tenantId: v.id("tenants"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    assignees: v.array(v.id("users")),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    parentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    // Verify project exists and user has access
    const project = await ctx.db.get(args.projectId)
    if (!project || project.tenantId !== args.tenantId) {
      throw new ConvexError("Project not found")
    }

    // Check permissions - Members can create tasks, but need to be on project team
    const currentUser = await requireUserAndRole(ctx, args.tenantId, ["Admin", "ProjectManager", "TeamLead", "Member"])

    // Verify user is on project team (unless Admin)
    if (
      currentUser.role !== "Admin" &&
      project.managerId !== currentUser._id &&
      !project.teamMembers.includes(currentUser._id)
    ) {
      throw new ConvexError("You must be a project team member to create tasks")
    }

    // Verify all assignees exist and belong to tenant
    for (const assigneeId of args.assignees) {
      const assignee = await ctx.db.get(assigneeId)
      if (!assignee || assignee.tenantId !== args.tenantId) {
        throw new ConvexError("Invalid assignee")
      }
    }

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "ToDo",
      createdBy: currentUser._id,
      tags: args.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Update project stats
    await updateProjectStats(ctx, args.projectId)

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: args.tenantId,
      userId: currentUser._id,
      action: "created_task",
      entityType: "task",
      entityId: taskId,
      details: {
        after: { title: args.title, assignees: args.assignees },
      },
      createdAt: Date.now(),
    })

    // Notify assignees
    for (const assigneeId of args.assignees) {
      if (assigneeId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          tenantId: args.tenantId,
          userId: assigneeId,
          type: "task_assigned",
          title: "Task Assigned",
          message: `You've been assigned to task: ${args.title}`,
          entityType: "task",
          entityId: taskId,
          isRead: false,
          createdAt: Date.now(),
        })
      }
    }

    return taskId
  },
})

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("ToDo"), v.literal("InProgress"), v.literal("Review"), v.literal("Done")),
  },
  handler: async (ctx, { taskId, status }) => {
    const task = await ctx.db.get(taskId)
    if (!task) {
      throw new ConvexError("Task not found")
    }

    // Check permissions - assignees and project team can update status
    const currentUser = await requireUserAndRole(ctx, task.tenantId, ["Admin", "ProjectManager", "TeamLead", "Member"])

    // Verify user can update this task
    const project = await ctx.db.get(task.projectId)
    const canUpdate =
      currentUser.role === "Admin" ||
      project?.managerId === currentUser._id ||
      project?.teamMembers.includes(currentUser._id) ||
      task.assignees.includes(currentUser._id)

    if (!canUpdate) {
      throw new ConvexError("You don't have permission to update this task")
    }

    const oldStatus = task.status
    const completedAt = status === "Done" ? Date.now() : undefined

    await ctx.db.patch(taskId, {
      status,
      completedAt,
      updatedAt: Date.now(),
    })

    // Update project stats
    await updateProjectStats(ctx, task.projectId)

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: task.tenantId,
      userId: currentUser._id,
      action: "updated_task_status",
      entityType: "task",
      entityId: taskId,
      details: {
        before: { status: oldStatus },
        after: { status },
      },
      createdAt: Date.now(),
    })

    // Notify assignees of status change
    for (const assigneeId of task.assignees) {
      if (assigneeId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          tenantId: task.tenantId,
          userId: assigneeId,
          type: "task_updated",
          title: "Task Status Updated",
          message: `Task "${task.title}" status changed to ${status}`,
          entityType: "task",
          entityId: taskId,
          isRead: false,
          createdAt: Date.now(),
        })
      }
    }

    return taskId
  },
})

// Helper function to update project statistics
async function updateProjectStats(ctx: any, projectId: string) {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .collect()

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: any) => t.status === "Done").length
  const inProgressTasks = tasks.filter((t: any) => t.status === "InProgress").length
  const overdueTasks = tasks.filter((t: any) => t.dueDate && t.dueDate < Date.now() && t.status !== "Done").length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const existingStats = await ctx.db
    .query("projectStats")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .unique()

  if (existingStats) {
    await ctx.db.patch(existingStats._id, {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      lastUpdated: Date.now(),
    })
  }
}
