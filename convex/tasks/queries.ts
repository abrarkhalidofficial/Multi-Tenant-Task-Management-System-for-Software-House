import { query } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"

export const tasksByProject = query({
  args: {
    tenantId: v.id("tenants"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { tenantId, projectId }) => {
    // Verify user has access to tenant
    await requireUserAndRole(ctx, tenantId, ["Admin", "ProjectManager", "TeamLead", "Member", "Client"])

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant_project", (q) => q.eq("tenantId", tenantId).eq("projectId", projectId))
      .collect()

    // Enrich tasks with assignee details
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assignees.map(async (assigneeId) => {
            const user = await ctx.db.get(assigneeId)
            return user
              ? {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  avatarUrl: user.avatarUrl,
                }
              : null
          }),
        )

        const createdBy = await ctx.db.get(task.createdBy)

        return {
          ...task,
          assignees: assignees.filter(Boolean),
          createdBy: createdBy
            ? {
                _id: createdBy._id,
                name: createdBy.name,
                email: createdBy.email,
              }
            : null,
        }
      }),
    )

    return enrichedTasks
  },
})

export const taskById = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId)
    if (!task) {
      return null
    }

    // Verify user has access
    await requireUserAndRole(ctx, task.tenantId, ["Admin", "ProjectManager", "TeamLead", "Member", "Client"])

    // Get assignee details
    const assignees = await Promise.all(
      task.assignees.map(async (assigneeId) => {
        const user = await ctx.db.get(assigneeId)
        return user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }
          : null
      }),
    )

    const createdBy = await ctx.db.get(task.createdBy)

    // Get comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect()

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId)
        return {
          ...comment,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                email: author.email,
                avatarUrl: author.avatarUrl,
              }
            : null,
        }
      }),
    )

    return {
      ...task,
      assignees: assignees.filter(Boolean),
      createdBy: createdBy
        ? {
            _id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email,
          }
        : null,
      comments: enrichedComments,
    }
  },
})
