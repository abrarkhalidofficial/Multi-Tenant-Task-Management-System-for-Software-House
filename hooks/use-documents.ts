"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useDocuments(filters?: {
  projectId?: string;
  taskId?: string;
  ownerId?: string;
  folder?: string;
  type?:
    | "pdf"
    | "docx"
    | "xlsx"
    | "pptx"
    | "txt"
    | "jpg"
    | "png"
    | "mp4"
    | "zip"
    | "figma";
  search?: string;
  starredOnly?: boolean;
  includeArchived?: boolean;
  sortBy?: "name" | "date" | "size" | "type" | "owner";
  sortOrder?: "asc" | "desc";
}) {
  const { sessionToken } = useCurrentUser();

  const documents = useQuery(
    api.documents.getDocuments,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return { documents: documents?.documents, isLoading: !documents };
}

export function useDocument(documentId: string) {
  const { sessionToken } = useCurrentUser();

  const document = useQuery(
    api.documents.getDocument,
    sessionToken && documentId
      ? {
          sessionToken,
          documentId: documentId as any,
        }
      : "skip"
  );

  return { document, isLoading: !document };
}

export function useUploadDocument() {
  const { sessionToken } = useCurrentUser();
  const uploadDocument = useMutation(api.documents.uploadDocument);

  const handleUploadDocument = async (data: {
    name: string;
    type:
      | "pdf"
      | "docx"
      | "xlsx"
      | "pptx"
      | "txt"
      | "jpg"
      | "png"
      | "mp4"
      | "zip"
      | "figma";
    size: number;
    url: string;
    projectId?: string;
    taskId?: string;
    folder?: string;
    tags?: string[];
    description?: string;
    thumbnail?: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      pages?: number;
    };
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await uploadDocument({
      sessionToken,
      ...data,
    });
  };

  return { uploadDocument: handleUploadDocument };
}

export function useUpdateDocument() {
  const { sessionToken } = useCurrentUser();
  const updateDocument = useMutation(api.documents.updateDocument);

  const handleUpdateDocument = async (
    documentId: string,
    data: {
      name?: string;
      folder?: string;
      tags?: string[];
      description?: string;
      isStarred?: boolean;
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateDocument({
      sessionToken,
      documentId: documentId as any,
      ...data,
    });
  };

  return { updateDocument: handleUpdateDocument };
}

export function useDeleteDocument() {
  const { sessionToken } = useCurrentUser();
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleDeleteDocument = async (documentId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await deleteDocument({
      sessionToken,
      documentId: documentId as any,
    });
  };

  return { deleteDocument: handleDeleteDocument };
}

export function useDocumentsByFolder(folder: string) {
  const { sessionToken } = useCurrentUser();

  const documents = useQuery(
    api.documents.getDocumentsByFolder,
    sessionToken
      ? {
          sessionToken,
          folder,
        }
      : "skip"
  );

  return { documents, isLoading: !documents };
}

export function useDocumentFolders() {
  const { sessionToken } = useCurrentUser();

  const folders = useQuery(
    api.documents.getDocumentFolders,
    sessionToken ? { sessionToken } : "skip"
  );

  return { folders, isLoading: !folders };
}

export function useStarredDocuments() {
  const { sessionToken } = useCurrentUser();

  const documents = useQuery(
    api.documents.getStarredDocuments,
    sessionToken ? { sessionToken } : "skip"
  );

  return { documents: documents?.documents, isLoading: !documents };
}

export function useToggleDocumentStar() {
  const { sessionToken } = useCurrentUser();
  const toggleStar = useMutation(api.documents.toggleDocumentStar);

  const handleToggleStar = async (documentId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await toggleStar({
      sessionToken,
      documentId: documentId as any,
    });
  };

  return { toggleStar: handleToggleStar };
}

export function useRecentDocuments(limit?: number) {
  const { sessionToken } = useCurrentUser();

  const documents = useQuery(
    api.documents.getRecentDocuments,
    sessionToken
      ? {
          sessionToken,
          limit,
        }
      : "skip"
  );

  return { documents, isLoading: !documents };
}
