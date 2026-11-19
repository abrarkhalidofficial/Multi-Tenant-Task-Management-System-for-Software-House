import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { hasPermission, sanitizeContent, formatRelativeTime } from "./utils";
import { Message, User, Conversation } from "./utils";

/**
 * Get conversation by ID
 */
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
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

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(currentUser._id)) {
      throw new Error("Not authorized to access this conversation");
    }

    // Get participant details
    const participants = await Promise.all(
      conversation.participantIds.map((participantId) =>
        ctx.db.get(participantId)
      )
    );

    // Get last message
    const lastMessage = conversation.lastMessageId
      ? await ctx.db.get(conversation.lastMessageId)
      : null;

    return {
      id: conversation._id,
      type: conversation.type,
      name: conversation.name,
      participants: participants.filter(Boolean).map((participant) => ({
        id: participant._id,
        name: participant.name,
        email: participant.email,
        avatar: participant.avatar,
        isOnline:
          participant.lastSeenAt &&
          Date.now() - participant.lastSeenAt < 5 * 60 * 1000, // Online if seen within 5 minutes
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage._id,
            content: lastMessage.content,
            type: lastMessage.type,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      isArchived: conversation.isArchived,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  },
});

/**
 * Get user's conversations
 */
export const getConversations = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.union(v.literal("individual"), v.literal("group"))),
    includeArchived: v.optional(v.boolean()),
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

    // Get conversations where user is participant
    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.contains(q.field("participantIds"), currentUser._id)
      )
      .collect();

    // Filter by type if provided
    if (args.type) {
      conversations = conversations.filter((conv) => conv.type === args.type);
    }

    // Filter out archived conversations unless requested
    if (!args.includeArchived) {
      conversations = conversations.filter((conv) => !conv.isArchived);
    }

    // Sort by last message time (newest first)
    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return bTime - aTime;
    });

    const total = conversations.length;
    const paginatedConversations = conversations.slice(offset, offset + limit);

    // Get additional data for each conversation
    const conversationsWithData = await Promise.all(
      paginatedConversations.map(async (conversation) => {
        const participants = await Promise.all(
          conversation.participantIds.map((participantId) =>
            ctx.db.get(participantId)
          )
        );

        const lastMessage = conversation.lastMessageId
          ? await ctx.db.get(conversation.lastMessageId)
          : null;

        // Get unread message count
        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .filter((q) => q.eq(q.field("status"), "delivered"))
          .collect()
          .then((messages) => messages.length);

        return {
          id: conversation._id,
          type: conversation.type,
          name: conversation.name,
          participants: participants.filter(Boolean).map((participant) => ({
            id: participant._id,
            name: participant.name,
            email: participant.email,
            avatar: participant.avatar,
            isOnline:
              participant.lastSeenAt &&
              Date.now() - participant.lastSeenAt < 5 * 60 * 1000,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage._id,
                content: lastMessage.content,
                type: lastMessage.type,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
          isArchived: conversation.isArchived,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          relativeTime: lastMessage
            ? formatRelativeTime(lastMessage.createdAt)
            : formatRelativeTime(conversation.createdAt),
        };
      })
    );

    return {
      conversations: conversationsWithData,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Get messages in a conversation
 */
export const getMessages = query({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    before: v.optional(v.number()),
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

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(currentUser._id)) {
      throw new Error("Not authorized to access this conversation");
    }

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get messages
    let messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Filter by timestamp if provided
    if (args.before) {
      messages = messages.filter((msg) => msg.createdAt < args.before);
    }

    // Sort by creation date (newest first)
    messages.sort((a, b) => b.createdAt - a.createdAt);

    const total = messages.length;
    const paginatedMessages = messages.slice(offset, offset + limit);

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      paginatedMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        return {
          id: message._id,
          content: message.content,
          type: message.type,
          status: message.status,
          sender: sender
            ? {
                id: sender._id,
                name: sender.name,
                email: sender.email,
                avatar: sender.avatar,
              }
            : null,
          mentions: message.mentions,
          attachments: message.attachments,
          replyToId: message.replyToId,
          isEdited: message.isEdited,
          editedAt: message.editedAt,
          createdAt: message.createdAt,
          relativeTime: formatRelativeTime(message.createdAt),
        };
      })
    );

    // Mark messages as read if they're from other users
    const unreadMessages = paginatedMessages.filter(
      (msg) => msg.senderId !== currentUser._id && msg.status === "delivered"
    );

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        status: "read",
        updatedAt: Date.now(),
      });
    }

    return {
      messages: messagesWithSenders.reverse(), // Return in chronological order
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Send message
 */
export const sendMessage = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.optional(
      v.union(v.literal("text"), v.literal("image"), v.literal("file"))
    ),
    mentions: v.optional(v.array(v.id("users"))),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    replyToId: v.optional(v.id("messages")),
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

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(currentUser._id)) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    // Validate mentions
    if (args.mentions && args.mentions.length > 0) {
      const mentionedUsers = await Promise.all(
        args.mentions.map((userId) => ctx.db.get(userId))
      );

      const invalidMentions = mentionedUsers.filter(
        (user) => !user || !conversation.participantIds.includes(user._id)
      );

      if (invalidMentions.length > 0) {
        throw new Error("Invalid user mentions");
      }
    }

    // Validate reply-to message
    if (args.replyToId) {
      const replyToMessage = await ctx.db.get(args.replyToId);
      if (
        !replyToMessage ||
        replyToMessage.conversationId !== args.conversationId
      ) {
        throw new Error("Invalid reply-to message");
      }
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      tenantId: currentUser.tenantId,
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: sanitizeContent(args.content),
      type: args.type || "text",
      status: "sent",
      mentions: args.mentions || [],
      attachments: args.attachments || [],
      replyToId: args.replyToId,
      isEdited: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update conversation last message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notifications for mentions
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        if (mentionedUserId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            tenantId: currentUser.tenantId,
            userId: mentionedUserId,
            type: "mention" as const,
            title: "You were mentioned",
            message: `${currentUser.name} mentioned you in a message: "${args.content}"`,
            data: {
              conversationId: args.conversationId,
              senderId: currentUser._id,
            },
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    // Create notifications for other participants (excluding sender and mentioned users)
    const otherParticipants = conversation.participantIds.filter(
      (participantId) =>
        participantId !== currentUser._id &&
        !(args.mentions || []).includes(participantId)
    );

    for (const participantId of otherParticipants) {
      await ctx.db.insert("notifications", {
        tenantId: currentUser.tenantId,
        userId: participantId,
        type: "message" as const,
        title: "New message",
        message: `${currentUser.name}: ${args.content}`,
        data: {
          conversationId: args.conversationId,
          senderId: currentUser._id,
        },
        isRead: false,
        createdAt: Date.now(),
      });
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "sent_message",
      resourceType: "message" as const,
      resourceId: messageId.toString(),
      changes: {
        before: null,
        after: { conversationId: args.conversationId, content: args.content },
      },
      createdAt: Date.now(),
    });

    return {
      messageId,
      success: true,
    };
  },
});

/**
 * Update message
 */
export const updateMessage = mutation({
  args: {
    sessionToken: v.string(),
    messageId: v.id("messages"),
    content: v.string(),
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

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the sender
    if (message.senderId !== currentUser._id) {
      throw new Error("Can only edit your own messages");
    }

    // Ensure message belongs to user's tenant
    if (message.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot edit messages from other tenants");
    }

    // Update message
    await ctx.db.patch(args.messageId, {
      content: sanitizeContent(args.content),
      isEdited: true,
      editedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "updated_message",
      resourceType: "message" as const,
      resourceId: args.messageId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete message
 */
export const deleteMessage = mutation({
  args: {
    sessionToken: v.string(),
    messageId: v.id("messages"),
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

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check permissions - only sender can delete their own messages
    if (message.senderId !== currentUser._id) {
      throw new Error("Can only delete your own messages");
    }

    // Ensure message belongs to user's tenant
    if (message.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot delete messages from other tenants");
    }

    // Delete message
    await ctx.db.delete(args.messageId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "deleted_message",
      resourceType: "message" as const,
      resourceId: args.messageId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create conversation
 */
export const createConversation = mutation({
  args: {
    sessionToken: v.string(),
    type: v.union(v.literal("individual"), v.literal("group")),
    name: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
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

    // Validate participants
    const participants = await Promise.all(
      args.participantIds.map((participantId) => ctx.db.get(participantId))
    );

    const invalidParticipants = participants.filter(
      (participant) =>
        !participant || participant.tenantId !== currentUser.tenantId
    );

    if (invalidParticipants.length > 0) {
      throw new Error("Invalid participant IDs");
    }

    // Ensure current user is included in participants
    const participantIds = args.participantIds.includes(currentUser._id)
      ? args.participantIds
      : [...args.participantIds, currentUser._id];

    // Validate project association if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.tenantId !== currentUser.tenantId) {
        throw new Error("Invalid project");
      }
    }

    // For individual conversations, ensure only 2 participants
    if (args.type === "individual" && participantIds.length !== 2) {
      throw new Error(
        "Individual conversations must have exactly 2 participants"
      );
    }

    // Check if individual conversation already exists
    if (args.type === "individual") {
      const existingConversations = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) =>
          q.eq("participantIds", participantIds)
        )
        .filter((q) => q.eq(q.field("type"), "individual"))
        .collect();

      if (existingConversations.length > 0) {
        return { conversationId: existingConversations[0]._id, existing: true };
      }
    }

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      tenantId: currentUser.tenantId,
      projectId: args.projectId,
      type: args.type,
      name: args.type === "group" ? args.name : undefined,
      participantIds,
      lastMessageId: undefined,
      lastMessageAt: undefined,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "created_conversation",
      resourceType: "conversation" as const,
      resourceId: conversationId.toString(),
      changes: {
        before: null,
        after: { type: args.type, participantIds },
      },
      createdAt: Date.now(),
    });

    return {
      conversationId,
      existing: false,
      success: true,
    };
  },
});

/**
 * Archive conversation
 */
export const archiveConversation = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
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

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(currentUser._id)) {
      throw new Error("Not authorized to archive this conversation");
    }

    // Archive conversation
    await ctx.db.patch(args.conversationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get unread message count
 */
export const getUnreadMessageCount = query({
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

    // Get user's conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.contains(q.field("participantIds"), currentUser._id)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    let totalUnread = 0;

    for (const conversation of conversations) {
      // Get unread messages in this conversation
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .filter((q) => q.eq(q.field("senderId"), currentUser._id))
        .filter((q) => q.eq(q.field("status"), "delivered"))
        .collect();

      totalUnread += unreadMessages.length;
    }

    return { unreadCount: totalUnread };
  },
});

/**
 * Mark conversation as read
 */
export const markConversationAsRead = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
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

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(currentUser._id)) {
      throw new Error("Not authorized to access this conversation");
    }

    // Get all messages in the conversation
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Filter messages from other users that are delivered
    const messages = allMessages.filter(
      (msg) => msg.senderId !== currentUser._id && msg.status === "delivered"
    );

    for (const message of messages) {
      await ctx.db.patch(message._id, {
        status: "read",
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      markedCount: messages.length,
    };
  },
});
