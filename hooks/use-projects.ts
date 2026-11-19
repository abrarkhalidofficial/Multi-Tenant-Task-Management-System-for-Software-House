"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useProjects(filters?: {
  status?: "planning" | "active" | "on_hold" | "completed" | "archived";
  ownerId?: string;
  teamId?: string;
  search?: string;
  includeArchived?: boolean;
}) {
  const { sessionToken } = useCurrentUser();

  const { data: projects, isLoading } = useQuery(
    api.projects.getProjects,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return { projects, isLoading };
}

export function useProject(projectId: string) {
  const { sessionToken } = useCurrentUser();

  const { data: project, isLoading } = useQuery(
    api.projects.getProject,
    sessionToken && projectId
      ? {
          sessionToken,
          projectId: projectId as any,
        }
      : "skip"
  );

  return { project, isLoading };
}

export function useUserProjects(userId?: string, includeMember?: boolean) {
  const { sessionToken } = useCurrentUser();

  const { data: userProjects, isLoading } = useQuery(
    api.projects.getUserProjects,
    sessionToken
      ? {
          sessionToken,
          userId: userId as any,
          includeMember,
        }
      : "skip"
  );

  return { userProjects, isLoading };
}

export function useCreateProject() {
  const { sessionToken } = useCurrentUser();
  const createProject = useMutation(api.projects.createProject);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    status?: "planning" | "active" | "on_hold" | "completed" | "archived";
    priority?: "low" | "medium" | "high";
    startDate?: number;
    endDate?: number;
    deadline?: number;
    teamId?: string;
    memberIds?: string[];
    tags?: string[];
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createProject({
      sessionToken,
      ...data,
    });
  };

  return { createProject: handleCreateProject };
}

export function useUpdateProject() {
  const { sessionToken } = useCurrentUser();
  const updateProject = useMutation(api.projects.updateProject);

  const handleUpdateProject = async (
    projectId: string,
    data: {
      name?: string;
      description?: string;
      status?: "planning" | "active" | "on_hold" | "completed" | "archived";
      priority?: "low" | "medium" | "high";
      startDate?: number;
      endDate?: number;
      deadline?: number;
      teamId?: string;
      memberIds?: string[];
      tags?: string[];
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateProject({
      sessionToken,
      projectId: projectId as any,
      ...data,
    });
  };

  return { updateProject: handleUpdateProject };
}

export function useArchiveProject() {
  const { sessionToken } = useCurrentUser();
  const archiveProject = useMutation(api.projects.archiveProject);

  const handleArchiveProject = async (projectId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await archiveProject({
      sessionToken,
      projectId: projectId as any,
    });
  };

  return { archiveProject: handleArchiveProject };
}

export function useProjectTemplates() {
  const { sessionToken } = useCurrentUser();

  const { data: templates, isLoading } = useQuery(
    api.projects.getProjectTemplates,
    sessionToken ? { sessionToken } : "skip"
  );

  return { templates, isLoading };
}

export function useCreateProjectFromTemplate() {
  const { sessionToken } = useCurrentUser();
  const createFromTemplate = useMutation(
    api.projects.createProjectFromTemplate
  );

  const handleCreateFromTemplate = async (
    templateId: string,
    data: {
      name: string;
      description?: string;
      startDate?: number;
      teamId?: string;
      memberIds?: string[];
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createFromTemplate({
      sessionToken,
      templateId: templateId as any,
      ...data,
    });
  };

  return { createFromTemplate: handleCreateFromTemplate };
}
