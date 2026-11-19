import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  hasPermission,
  formatFileSize,
  formatRelativeTime,
  sanitizeContent,
} from "./utils";
import { Document, User } from "./utils";

/**
 * Get document by ID
 */
export const getDocument = query({
  args: {
    documentId: v.id("documents"),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check permissions - users can read documents in their tenant
    if (document.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access documents from other tenants");
    }

    // Get owner details
    const owner = await ctx.db.get(document.ownerId);

    return {
      id: document._id,
      name: document.name,
      type: document.type,
      size: document.size,
      formattedSize: formatFileSize(document.size),
      url: document.url,
      owner: owner
        ? {
            id: owner._id,
            name: owner.name,
            email: owner.email,
            avatar: owner.avatar,
          }
        : null,
      folder: document.folder,
      tags: document.tags,
      isStarred: document.isStarred,
      thumbnail: document.thumbnail,
      description: document.description,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      relativeTime: formatRelativeTime(document.updatedAt),
    };
  },
});

/**
 * Get all documents for current tenant
 */
export const getDocuments = query({
  args: {
    sessionToken: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    ownerId: v.optional(v.id("users")),
    folder: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("pdf"),
        v.literal("docx"),
        v.literal("xlsx"),
        v.literal("pptx"),
        v.literal("txt"),
        v.literal("jpg"),
        v.literal("png"),
        v.literal("mp4"),
        v.literal("zip"),
        v.literal("figma")
      )
    ),
    search: v.optional(v.string()),
    starredOnly: v.optional(v.boolean()),
    includeArchived: v.optional(v.boolean()),
    sortBy: v.optional(
      v.union(
        v.literal("name"),
        v.literal("date"),
        v.literal("size"),
        v.literal("type"),
        v.literal("owner")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
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
    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";

    // Get documents based on filters
    let documents = await ctx.db
      .query("documents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    // Apply filters
    if (args.projectId) {
      documents = documents.filter((doc) => doc.projectId === args.projectId);
    }

    if (args.taskId) {
      documents = documents.filter((doc) => doc.taskId === args.taskId);
    }

    if (args.ownerId) {
      documents = documents.filter((doc) => doc.ownerId === args.ownerId);
    }

    if (args.folder) {
      documents = documents.filter((doc) => doc.folder === args.folder);
    }

    if (args.type) {
      documents = documents.filter((doc) => doc.type === args.type);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      documents = documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (args.starredOnly) {
      documents = documents.filter((doc) => doc.isStarred);
    }

    if (!args.includeArchived) {
      // Filter out documents that might be considered archived (no direct archive flag)
      // This could be enhanced with a proper archive system
    }

    // Sort documents
    documents.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = b.updatedAt - a.updatedAt;
          break;
        case "size":
          comparison = b.size - a.size;
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "owner":
          // This would require fetching owner names, skipping for now
          comparison = 0;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Get owner details for each document
    const documentsWithOwners = await Promise.all(
      documents.map(async (document) => {
        const owner = await ctx.db.get(document.ownerId);

        return {
          id: document._id,
          name: document.name,
          type: document.type,
          size: document.size,
          formattedSize: formatFileSize(document.size),
          url: document.url,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          folder: document.folder,
          tags: document.tags,
          isStarred: document.isStarred,
          thumbnail: document.thumbnail,
          description: document.description,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          relativeTime: formatRelativeTime(document.updatedAt),
        };
      })
    );

    const total = documentsWithOwners.length;
    const paginatedDocuments = documentsWithOwners.slice(
      offset,
      offset + limit
    );

    return {
      documents: paginatedDocuments,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Upload document
 */
export const uploadDocument = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("pdf"),
      v.literal("docx"),
      v.literal("xlsx"),
      v.literal("pptx"),
      v.literal("txt"),
      v.literal("jpg"),
      v.literal("png"),
      v.literal("mp4"),
      v.literal("zip"),
      v.literal("figma")
    ),
    size: v.number(),
    url: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    folder: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        duration: v.optional(v.number()),
        pages: v.optional(v.number()),
      })
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

    // Check permissions - anyone can upload documents
    if (!hasPermission(currentUser.role, "document", "create")) {
      throw new Error("Insufficient permissions");
    }

    // Validate project/task association
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.tenantId !== currentUser.tenantId) {
        throw new Error("Invalid project");
      }
    }

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.tenantId !== currentUser.tenantId) {
        throw new Error("Invalid task");
      }
    }

    // Create document
    const documentId = await ctx.db.insert("documents", {
      tenantId: currentUser.tenantId,
      projectId: args.projectId,
      taskId: args.taskId,
      name: sanitizeContent(args.name),
      type: args.type,
      size: args.size,
      url: args.url,
      ownerId: currentUser._id,
      folder: args.folder,
      tags: args.tags || [],
      isStarred: false,
      thumbnail: args.thumbnail,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "uploaded_document",
      resourceType: "document",
      resourceId: documentId.toString(),
      changes: {
        before: null,
        after: { name: args.name, type: args.type, size: args.size },
      },
      createdAt: Date.now(),
    });

    return {
      documentId,
      success: true,
    };
  },
});

/**
 * Update document
 */
export const updateDocument = mutation({
  args: {
    sessionToken: v.string(),
    documentId: v.id("documents"),
    name: v.optional(v.string()),
    folder: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    isStarred: v.optional(v.boolean()),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check permissions
    const isOwner = document.ownerId === currentUser._id;
    const canUpdate = hasPermission(
      currentUser.role,
      "document",
      "update",
      isOwner
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Ensure document belongs to user's tenant
    if (document.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot update documents from other tenants");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = sanitizeContent(args.name);
    if (args.folder !== undefined) updateData.folder = args.folder;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.description !== undefined)
      updateData.description = args.description
        ? sanitizeContent(args.description)
        : undefined;
    if (args.isStarred !== undefined) updateData.isStarred = args.isStarred;

    await ctx.db.patch(args.documentId, updateData);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "updated_document",
      resourceType: "document",
      resourceId: args.documentId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete document
 */
export const deleteDocument = mutation({
  args: {
    sessionToken: v.string(),
    documentId: v.id("documents"),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check permissions
    const isOwner = document.ownerId === currentUser._id;
    const canDelete = hasPermission(
      currentUser.role,
      "document",
      "delete",
      isOwner
    );

    if (!canDelete) {
      throw new Error("Insufficient permissions");
    }

    // Ensure document belongs to user's tenant
    if (document.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot delete documents from other tenants");
    }

    // Delete document
    await ctx.db.delete(args.documentId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "deleted_document",
      resourceType: "document",
      resourceId: args.documentId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get documents by folder
 */
export const getDocumentsByFolder = query({
  args: {
    sessionToken: v.string(),
    folder: v.string(),
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

    // Get documents by folder
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("folder"), args.folder))
      .collect();

    // Get owner details for each document
    const documentsWithOwners = await Promise.all(
      documents.map(async (document) => {
        const owner = await ctx.db.get(document.ownerId);

        return {
          id: document._id,
          name: document.name,
          type: document.type,
          size: document.size,
          formattedSize: formatFileSize(document.size),
          url: document.url,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          folder: document.folder,
          tags: document.tags,
          isStarred: document.isStarred,
          thumbnail: document.thumbnail,
          description: document.description,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          relativeTime: formatRelativeTime(document.updatedAt),
        };
      })
    );

    return documentsWithOwners;
  },
});

/**
 * Get document folders
 */
export const getDocumentFolders = query({
  args: {
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

    // Get all documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect();

    // Extract unique folders
    const folders = new Set<string>();
    documents.forEach((doc) => {
      if (doc.folder) {
        folders.add(doc.folder);
      }
    });

    // Get document count for each folder
    const folderStats = Array.from(folders).map((folder) => ({
      name: folder,
      count: documents.filter((doc) => doc.folder === folder).length,
      totalSize: documents
        .filter((doc) => doc.folder === folder)
        .reduce((sum, doc) => sum + doc.size, 0),
    }));

    return folderStats;
  },
});

/**
 * Star/unstar document
 */
export const toggleDocumentStar = mutation({
  args: {
    sessionToken: v.string(),
    documentId: v.id("documents"),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check permissions - anyone can star documents in their tenant
    if (document.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access documents from other tenants");
    }

    // Toggle star
    await ctx.db.patch(args.documentId, {
      isStarred: !document.isStarred,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      isStarred: !document.isStarred,
    };
  },
});

/**
 * Get starred documents
 */
export const getStarredDocuments = query({
  args: {
    sessionToken: v.string(),
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

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Get starred documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("isStarred"), true))
      .collect();

    // Get owner details for each document
    const documentsWithOwners = await Promise.all(
      documents.map(async (document) => {
        const owner = await ctx.db.get(document.ownerId);

        return {
          id: document._id,
          name: document.name,
          type: document.type,
          size: document.size,
          formattedSize: formatFileSize(document.size),
          url: document.url,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          folder: document.folder,
          tags: document.tags,
          isStarred: document.isStarred,
          thumbnail: document.thumbnail,
          description: document.description,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          relativeTime: formatRelativeTime(document.updatedAt),
        };
      })
    );

    const total = documentsWithOwners.length;
    const paginatedDocuments = documentsWithOwners.slice(
      offset,
      offset + limit
    );

    return {
      documents: paginatedDocuments,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Get recent documents
 */
export const getRecentDocuments = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
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

    const limit = args.limit || 10;

    // Get recent documents (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.gt(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    // Sort by creation date (newest first)
    documents.sort((a, b) => b.createdAt - a.createdAt);

    // Get owner details for each document
    const recentDocuments = await Promise.all(
      documents.slice(0, limit).map(async (document) => {
        const owner = await ctx.db.get(document.ownerId);

        return {
          id: document._id,
          name: document.name,
          type: document.type,
          size: document.size,
          formattedSize: formatFileSize(document.size),
          url: document.url,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          folder: document.folder,
          tags: document.tags,
          isStarred: document.isStarred,
          thumbnail: document.thumbnail,
          description: document.description,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          relativeTime: formatRelativeTime(document.updatedAt),
        };
      })
    );

    return recentDocuments;
  },
});
