import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  requirePermission,
  requireTaskAccess,
  requireProjectAccess,
} from "./middleware";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const { user } = await requirePermission(ctx, "files.upload");

    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    commentId: v.optional(v.id("taskComments")),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "files.upload");

    // Validate project access if provided
    if (args.projectId) {
      await requireProjectAccess(ctx, args.projectId);
    }

    // Validate task access if provided
    if (args.taskId) {
      await requireTaskAccess(ctx, args.taskId);
    }

    // Get file URL
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("Failed to get file URL");
    }

    const fileId = await ctx.db.insert("files", {
      tenantId: user.tenantId,
      name: args.name,
      size: args.size,
      type: args.type,
      storageId: args.storageId,
      url,
      uploadedBy: user._id,
      projectId: args.projectId,
      taskId: args.taskId,
      commentId: args.commentId,
      isPublic: args.isPublic || false,
      tags: args.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "file",
      entityId: fileId,
      projectId: args.projectId,
      taskId: args.taskId,
      action: "uploaded",
      details: {
        description: `${user.name} uploaded file "${args.name}"`,
      },
      createdAt: Date.now(),
    });

    return {
      fileId,
      url,
      message: "File uploaded successfully",
    };
  },
});

// Get files for a project
export const getProjectFiles = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get uploaders
    const uploaderIds = [...new Set(files.map((f) => f.uploadedBy))];
    const uploaders = await Promise.all(
      uploaderIds.map((id) => ctx.db.get(id))
    );
    const uploadersMap = new Map(
      uploaders.filter(Boolean).map((u) => [u!._id, u])
    );

    return files.map((file) => ({
      id: file._id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.url,
      uploadedBy: uploadersMap.get(file.uploadedBy)
        ? {
            id: uploadersMap.get(file.uploadedBy)!._id,
            name: uploadersMap.get(file.uploadedBy)!.name,
            email: uploadersMap.get(file.uploadedBy)!.email,
          }
        : null,
      isPublic: file.isPublic,
      tags: file.tags,
      createdAt: file.createdAt,
    }));
  },
});

// Get files for a task
export const getTaskFiles = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const files = await ctx.db
      .query("files")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Get uploaders
    const uploaderIds = [...new Set(files.map((f) => f.uploadedBy))];
    const uploaders = await Promise.all(
      uploaderIds.map((id) => ctx.db.get(id))
    );
    const uploadersMap = new Map(
      uploaders.filter(Boolean).map((u) => [u!._id, u])
    );

    return files.map((file) => ({
      id: file._id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.url,
      uploadedBy: uploadersMap.get(file.uploadedBy)
        ? {
            id: uploadersMap.get(file.uploadedBy)!._id,
            name: uploadersMap.get(file.uploadedBy)!.name,
            email: uploadersMap.get(file.uploadedBy)!.email,
          }
        : null,
      isPublic: file.isPublic,
      tags: file.tags,
      createdAt: file.createdAt,
    }));
  },
});

// Delete a file
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "files.delete");

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    // Check tenant access
    if (file.tenantId !== user.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this file");
    }

    // Check if user can delete this file
    if (
      file.uploadedBy !== user._id &&
      !["admin", "project_manager"].includes(user.role)
    ) {
      throw new ConvexError("You don't have permission to delete this file");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete from database
    await ctx.db.delete(args.fileId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "file",
      entityId: args.fileId,
      action: "deleted",
      details: {
        description: `${user.name} deleted file "${file.name}"`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "File deleted successfully" };
  },
});

// Update file metadata
export const updateFile = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "files.upload");

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    // Check tenant access
    if (file.tenantId !== user.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this file");
    }

    // Check if user can update this file
    if (
      file.uploadedBy !== user._id &&
      !["admin", "project_manager"].includes(user.role)
    ) {
      throw new ConvexError("You don't have permission to update this file");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.fileId, updates);

    return { success: true, message: "File updated successfully" };
  },
});

// Attach file to task
export const attachFileToTask = mutation({
  args: {
    fileId: v.id("files"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { user, task } = await requireTaskAccess(ctx, args.taskId);

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    // Check tenant access
    if (file.tenantId !== user.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this file");
    }

    // Update file with task association
    await ctx.db.patch(args.fileId, {
      taskId: args.taskId,
      projectId: task.projectId,
      updatedAt: Date.now(),
    });

    // Update task attachments
    const taskAttachments = task.attachments || [];
    const newAttachment = {
      id: file._id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      uploadedAt: file.createdAt,
      uploadedBy: file.uploadedBy,
    };

    await ctx.db.patch(args.taskId, {
      attachments: [...taskAttachments, newAttachment],
      updatedAt: Date.now(),
    });

    return { success: true, message: "File attached to task successfully" };
  },
});

// Attach file to comment
export const attachFileToComment = mutation({
  args: {
    fileId: v.id("files"),
    commentId: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "comments.create");

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }

    // Check tenant access
    if (file.tenantId !== user.tenantId || comment.tenantId !== user.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this file or comment"
      );
    }

    // Update file with comment association
    await ctx.db.patch(args.fileId, {
      commentId: args.commentId,
      updatedAt: Date.now(),
    });

    // Update comment attachments
    const commentAttachments = comment.attachments || [];
    const newAttachment = {
      id: file._id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      uploadedAt: file.createdAt,
    };

    await ctx.db.patch(args.commentId, {
      attachments: [...commentAttachments, newAttachment],
      updatedAt: Date.now(),
    });

    return { success: true, message: "File attached to comment successfully" };
  },
});
