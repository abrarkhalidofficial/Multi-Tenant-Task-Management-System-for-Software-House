import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const createComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const task = await ctx.db.get(args.taskId)
    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new Error("Task not found or access denied")
    }

    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorId: currentUser._id,
      content: args.content,
      tenantId: currentUser.tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "comment",
      entityId: commentId,
      action: "created",
      createdAt: Date.now(),
    })

    if (task.assigneeId && task.assigneeId !== currentUser._id) {
      await ctx.db.insert("notifications", {
        tenantId: currentUser.tenantId,
        userId: task.assigneeId,
        type: "task_commented",
        title: "New Comment",
        message: `${currentUser.name} commented on task: ${task.title}`,
        entityType: "task",
        entityId: args.taskId,
        isRead: false,
        createdAt: Date.now(),
      })
    }

    return commentId
  },
})

export const getCommentsByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      return []
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      return []
    }

    const task = await ctx.db.get(args.taskId)
    if (!task || task.tenantId !== currentUser.tenantId) {
      return []
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect()

    // Get author information for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId)
        return {
          ...comment,
          author: author ? { name: author.name, email: author.email } : null,
        }
      }),
    )

    return commentsWithAuthors
  },
})

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment || comment.tenantId !== currentUser.tenantId) {
      throw new Error("Comment not found or access denied")
    }

    if (comment.authorId !== currentUser._id) {
      throw new Error("Not authorized to edit this comment")
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    })

    // Create activity log for comment update
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "comment",
      entityId: args.commentId,
      action: "updated",
      createdAt: Date.now(),
    })

    return args.commentId
  },
})

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment || comment.tenantId !== currentUser.tenantId) {
      throw new Error("Comment not found or access denied")
    }

    if (comment.authorId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Not authorized to delete this comment")
    }

    await ctx.db.delete(args.commentId)

    // Create activity log for comment deletion
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "comment",
      entityId: args.commentId,
      action: "deleted",
      createdAt: Date.now(),
    })

    return args.commentId
  },
})
