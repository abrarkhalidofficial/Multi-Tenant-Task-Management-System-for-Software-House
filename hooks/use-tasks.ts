"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useTasks(filters?: {
  projectId?: string;
  assigneeId?: string;
  reporterId?: string;
  status?: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  search?: string;
  includeArchived?: boolean;
  includeOverdue?: boolean;
}) {
  const { sessionToken } = useCurrentUser();

  const { data: tasks, isLoading } = useQuery(
    api.tasks.getTasks,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return { tasks, isLoading };
}

export function useTask(taskId: string) {
  const { sessionToken } = useCurrentUser();

  const { data: task, isLoading } = useQuery(
    api.tasks.getTask,
    sessionToken && taskId
      ? {
          sessionToken,
          taskId: taskId as any,
        }
      : "skip"
  );

  return { task, isLoading };
}

export function useMyTasks(filters?: {
  status?: "todo" | "in_progress" | "review" | "done";
  includeOverdue?: boolean;
}) {
  const { sessionToken } = useCurrentUser();

  const { data: myTasks, isLoading } = useQuery(
    api.tasks.getMyTasks,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return { myTasks, isLoading };
}

export function useCreateTask() {
  const { sessionToken } = useCurrentUser();
  const createTask = useMutation(api.tasks.createTask);

  const handleCreateTask = async (data: {
    projectId: string;
    name: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assigneeIds?: string[];
    dueDate?: number;
    startDate?: number;
    estimatedHours?: number;
    tags?: string[];
    subtasks?: Array<{ id: string; name: string; completed: boolean }>;
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createTask({
      sessionToken,
      ...data,
    });
  };

  return { createTask: handleCreateTask };
}

export function useUpdateTask() {
  const { sessionToken } = useCurrentUser();
  const updateTask = useMutation(api.tasks.updateTask);

  const handleUpdateTask = async (
    taskId: string,
    data: {
      name?: string;
      description?: string;
      status?: "todo" | "in_progress" | "review" | "done";
      priority?: "low" | "medium" | "high" | "urgent";
      assigneeIds?: string[];
      dueDate?: number;
      startDate?: number;
      estimatedHours?: number;
      actualHours?: number;
      tags?: string[];
      subtasks?: Array<{ id: string; name: string; completed: boolean }>;
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateTask({
      sessionToken,
      taskId: taskId as any,
      ...data,
    });
  };

  return { updateTask: handleUpdateTask };
}

export function useDeleteTask() {
  const { sessionToken } = useCurrentUser();
  const deleteTask = useMutation(api.tasks.deleteTask);

  const handleDeleteTask = async (taskId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await deleteTask({
      sessionToken,
      taskId: taskId as any,
    });
  };

  return { deleteTask: handleDeleteTask };
}

export function useMoveTaskToNextStatus() {
  const { sessionToken } = useCurrentUser();
  const moveToNextStatus = useMutation(api.tasks.moveTaskToNextStatus);

  const handleMoveToNextStatus = async (taskId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await moveToNextStatus({
      sessionToken,
      taskId: taskId as any,
    });
  };

  return { moveToNextStatus: handleMoveToNextStatus };
}

export function useBulkUpdateTaskStatus() {
  const { sessionToken } = useCurrentUser();
  const bulkUpdate = useMutation(api.tasks.bulkUpdateTaskStatus);

  const handleBulkUpdate = async (
    taskIds: string[],
    newStatus: "todo" | "in_progress" | "review" | "done"
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await bulkUpdate({
      sessionToken,
      taskIds: taskIds as any[],
      newStatus,
    });
  };

  return { bulkUpdate: handleBulkUpdate };
}

export function useTaskComments(taskId: string) {
  const { sessionToken } = useCurrentUser();

  const comments = useQuery(
    api.tasks.getTaskComments,
    sessionToken && taskId
      ? {
          sessionToken,
          taskId: taskId as any,
        }
      : "skip"
  );

  return { comments: comments?.comments, isLoading: !comments };
}

export function useAddTaskComment() {
  const { sessionToken } = useCurrentUser();
  const addComment = useMutation(api.tasks.addTaskComment);

  const handleAddComment = async (
    taskId: string,
    content: string,
    mentions?: string[]
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await addComment({
      sessionToken,
      taskId: taskId as any,
      content,
      mentions: mentions as any[],
    });
  };

  return { addComment: handleAddComment };
}

export function useTaskStats(projectId?: string) {
  const { sessionToken } = useCurrentUser();

  const stats = useQuery(
    api.tasks.getTaskStats,
    sessionToken
      ? {
          sessionToken,
          projectId: projectId as any,
        }
      : "skip"
  );

  return { stats, isLoading: !stats };
}

export function useTasksByStatus(
  status: "todo" | "in_progress" | "review" | "done",
  projectId?: string
) {
  const { sessionToken } = useCurrentUser();

  const tasks = useQuery(
    api.tasks.getTasksByStatus,
    sessionToken
      ? {
          sessionToken,
          status,
          projectId: projectId as any,
        }
      : "skip"
  );

  return { tasks, isLoading: !tasks };
}
