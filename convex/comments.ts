import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, requireTaskAccess } from "./middleware";

// Get comments for a task
export const getTaskComments = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Get authors
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id)));
    const authorsMap = new Map(authors.filter(Boolean).map((a) => [a!._id, a]));

    // Get mentioned users
    const mentionedUserIds = [
      ...new Set(comments.flatMap((c) => c.mentions || []).filter(Boolean)),
    ];
    const mentionedUsers = await Promise.all(
      mentionedUserIds.map((id) => ctx.db.get(id))
    );
    const mentionedUsersMap = new Map(
      mentionedUsers.filter(Boolean).map((u) => [u!._id, u])
    );

    return comments
      .map((comment) => ({
        id: comment._id,
        content: comment.content,
        author: authorsMap.get(comment.authorId)
          ? {
              id: authorsMap.get(comment.authorId)!._id,
              name: authorsMap.get(comment.authorId)!.name,
              email: authorsMap.get(comment.authorId)!.email,
            }
          : null,
        mentions: (comment.mentions || [])
          .map((userId) => mentionedUsersMap.get(userId))
          .filter(Boolean)
          .map((user) => ({
            id: user!._id,
            name: user!.name,
            email: user!.email,
          })),
        attachments: comment.attachments,
        isEdited: comment.isEdited,
        parentCommentId: comment.parentCommentId,
        reactions: comment.reactions,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Add a comment to a task
export const addTaskComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          url: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    parentCommentId: v.optional(v.id("taskComments")),
  },
  handler: async (ctx, args) => {
    const { user, task, project } = await requireTaskAccess(ctx, args.taskId);

    // Validate mentions
    if (args.mentions) {
      for (const userId of args.mentions) {
        const mentionedUser = await ctx.db.get(userId);
        if (!mentionedUser || mentionedUser.tenantId !== user.tenantId) {
          throw new ConvexError("Invalid mentioned user");
        }
      }
    }

    // Validate parent comment if provided
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.taskId !== args.taskId) {
        throw new ConvexError("Invalid parent comment");
      }
    }

    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      tenantId: user.tenantId,
      authorId: user._id,
      content: args.content,
      mentions: args.mentions || [],
      attachments: args.attachments || [],
      parentCommentId: args.parentCommentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "comment",
      entityId: commentId,
      projectId: task.projectId,
      taskId: args.taskId,
      action: "created",
      details: {
        description: `${user.name} commented on task "${task.title}"`,
      },
      createdAt: Date.now(),
    });

    // Create notifications for mentions
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        if (mentionedUserId !== user._id) {
          // Don't notify the commenter
          await ctx.db.insert("notifications", {
            userId: mentionedUserId,
            tenantId: user.tenantId,
            type: "mention",
            title: "You were mentioned",
            message: `${user.name} mentioned you in a comment on "${task.title}"`,
            entityType: "comment",
            entityId: commentId,
            taskId: args.taskId,
            projectId: task.projectId,
            isRead: false,
            isArchived: false,
            priority: "normal",
            createdAt: Date.now(),
          });
        }
      }
    }

    return {
      commentId,
      message: "Comment added successfully",
    };
  },
});

// Update a comment
export const updateTaskComment = mutation({
  args: {
    commentId: v.id("taskComments"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "comments.edit");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    // Check if user can edit this comment
    if (
      comment.authorId !== user._id &&
      !["admin", "project_manager"].includes(user.role)
    ) {
      throw new ConvexError("You don't have permission to edit this comment");
    }

    // Check tenant access
    if (comment.tenantId !== user.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this comment"
      );
    }

    // Validate mentions
    if (args.mentions) {
      for (const userId of args.mentions) {
        const mentionedUser = await ctx.db.get(userId);
        if (!mentionedUser || mentionedUser.tenantId !== user.tenantId) {
          throw new ConvexError("Invalid mentioned user");
        }
      }
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      mentions: args.mentions || [],
      isEdited: true,
      updatedAt: Date.now(),
    });

    return { success: true, message: "Comment updated successfully" };
  },
});

// Delete a comment
export const deleteTaskComment = mutation({
  args: {
    commentId: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "comments.delete");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    // Check if user can delete this comment
    if (
      comment.authorId !== user._id &&
      !["admin", "project_manager"].includes(user.role)
    ) {
      throw new ConvexError("You don't have permission to delete this comment");
    }

    // Check tenant access
    if (comment.tenantId !== user.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this comment"
      );
    }

    await ctx.db.delete(args.commentId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "comment",
      entityId: args.commentId,
      action: "deleted",
      details: {
        description: `${user.name} deleted a comment`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Comment deleted successfully" };
  },
});

// Add reaction to a comment
export const addCommentReaction = mutation({
  args: {
    commentId: v.id("taskComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "comments.view");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    // Check tenant access
    if (comment.tenantId !== user.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this comment"
      );
    }

    const reactions = comment.reactions || [];
    const existingReaction = reactions.find(
      (r) => r.emoji === args.emoji && r.userId === user._id
    );

    if (existingReaction) {
      throw new ConvexError("You have already reacted with this emoji");
    }

    const newReaction = {
      emoji: args.emoji,
      userId: user._id,
      createdAt: Date.now(),
    };

    await ctx.db.patch(args.commentId, {
      reactions: [...reactions, newReaction],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove reaction from a comment
export const removeCommentReaction = mutation({
  args: {
    commentId: v.id("taskComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "comments.view");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    // Check tenant access
    if (comment.tenantId !== user.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this comment"
      );
    }

    const reactions = comment.reactions || [];
    const updatedReactions = reactions.filter(
      (r) => !(r.emoji === args.emoji && r.userId === user._id)
    );

    await ctx.db.patch(args.commentId, {
      reactions: updatedReactions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
