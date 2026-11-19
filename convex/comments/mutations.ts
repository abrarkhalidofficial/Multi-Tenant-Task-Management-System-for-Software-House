import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"
import { ConvexError } from "convex/values"

export const addComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { taskId, content, mentions = [] }) => {
    const task = await ctx.db.get(taskId)
    if (!task) {
      throw new ConvexError("Task not found")
    }

    // Check permissions - project team members can comment
    const currentUser = await requireUserAndRole(ctx, task.tenantId, ["Admin", "ProjectManager", "TeamLead", "Member"])

    const project = await ctx.db.get(task.projectId)
    const canComment =
      currentUser.role === "Admin" ||
      project?.managerId === currentUser._id ||
      project?.teamMembers.includes(currentUser._id) ||
      task.assignees.includes(currentUser._id)

    if (!canComment) {
      throw new ConvexError("You don't have permission to comment on this task")
    }

    // Verify mentions exist and belong to tenant
    for (const mentionId of mentions) {
      const mentionedUser = await ctx.db.get(mentionId)
      if (!mentionedUser || mentionedUser.tenantId !== task.tenantId) {
        throw new ConvexError("Invalid user mention")
      }
    }

    const commentId = await ctx.db.insert("comments", {
      tenantId: task.tenantId,
      taskId,
      authorId: currentUser._id,
      content,
      mentions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: task.tenantId,
      userId: currentUser._id,
      action: "added_comment",
      entityType: "task",
      entityId: taskId,
      details: {
        after: { commentId, mentions },
      },
      createdAt: Date.now(),
    })

    // Notify mentioned users
    for (const mentionId of mentions) {
      if (mentionId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          tenantId: task.tenantId,
          userId: mentionId,
          type: "comment_mention",
          title: "Mentioned in Comment",
          message: `${currentUser.name} mentioned you in a comment on "${task.title}"`,
          entityType: "task",
          entityId: taskId,
          isRead: false,
          createdAt: Date.now(),
        })
      }
    }

    // Notify task assignees (excluding author and mentions)
    for (const assigneeId of task.assignees) {
      if (assigneeId !== currentUser._id && !mentions.includes(assigneeId)) {
        await ctx.db.insert("notifications", {
          tenantId: task.tenantId,
          userId: assigneeId,
          type: "task_updated",
          title: "New Comment",
          message: `${currentUser.name} commented on "${task.title}"`,
          entityType: "task",
          entityId: taskId,
          isRead: false,
          createdAt: Date.now(),
        })
      }
    }

    return commentId
  },
})
