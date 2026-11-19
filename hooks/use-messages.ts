"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useConversations(filters?: {
  type?: "individual" | "group";
  includeArchived?: boolean;
}) {
  const { sessionToken } = useCurrentUser();

  const conversations = useQuery(
    api.messages.getConversations,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return {
    conversations: conversations?.conversations,
    isLoading: !conversations,
  };
}

export function useConversation(conversationId: string) {
  const { sessionToken } = useCurrentUser();

  const conversation = useQuery(
    api.messages.getConversation,
    sessionToken && conversationId
      ? {
          sessionToken,
          conversationId: conversationId as any,
        }
      : "skip"
  );

  return { conversation, isLoading: !conversation };
}

export function useMessages(
  conversationId: string,
  options?: {
    limit?: number;
    offset?: number;
    before?: number;
  }
) {
  const { sessionToken } = useCurrentUser();

  const messages = useQuery(
    api.messages.getMessages,
    sessionToken && conversationId
      ? {
          sessionToken,
          conversationId: conversationId as any,
          limit: options?.limit,
          offset: options?.offset,
          before: options?.before,
        }
      : "skip"
  );

  return { messages: messages?.messages, isLoading: !messages };
}

export function useSendMessage() {
  const { sessionToken } = useCurrentUser();
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSendMessage = async (data: {
    conversationId: string;
    content: string;
    type?: "text" | "image" | "file";
    mentions?: string[];
    attachments?: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>;
    replyToId?: string;
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await sendMessage({
      sessionToken,
      ...data,
    });
  };

  return { sendMessage: handleSendMessage };
}

export function useUpdateMessage() {
  const { sessionToken } = useCurrentUser();
  const updateMessage = useMutation(api.messages.updateMessage);

  const handleUpdateMessage = async (messageId: string, content: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateMessage({
      sessionToken,
      messageId: messageId as any,
      content,
    });
  };

  return { updateMessage: handleUpdateMessage };
}

export function useDeleteMessage() {
  const { sessionToken } = useCurrentUser();
  const deleteMessage = useMutation(api.messages.deleteMessage);

  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await deleteMessage({
      sessionToken,
      messageId: messageId as any,
    });
  };

  return { deleteMessage: handleDeleteMessage };
}

export function useCreateConversation() {
  const { sessionToken } = useCurrentUser();
  const createConversation = useMutation(api.messages.createConversation);

  const handleCreateConversation = async (data: {
    type: "individual" | "group";
    name?: string;
    participantIds: string[];
    projectId?: string;
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createConversation({
      sessionToken,
      ...data,
    });
  };

  return { createConversation: handleCreateConversation };
}

export function useArchiveConversation() {
  const { sessionToken } = useCurrentUser();
  const archiveConversation = useMutation(api.messages.archiveConversation);

  const handleArchiveConversation = async (conversationId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await archiveConversation({
      sessionToken,
      conversationId: conversationId as any,
    });
  };

  return { archiveConversation: handleArchiveConversation };
}

export function useUnreadMessageCount() {
  const { sessionToken } = useCurrentUser();

  const count = useQuery(
    api.messages.getUnreadMessageCount,
    sessionToken ? { sessionToken } : "skip"
  );

  return { unreadCount: count?.unreadCount, isLoading: !count };
}

export function useMarkConversationAsRead() {
  const { sessionToken } = useCurrentUser();
  const markAsRead = useMutation(api.messages.markConversationAsRead);

  const handleMarkAsRead = async (conversationId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await markAsRead({
      sessionToken,
      conversationId: conversationId as any,
    });
  };

  return { markAsRead: handleMarkAsRead };
}
