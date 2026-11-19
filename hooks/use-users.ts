"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useUsers(filters?: {
  search?: string;
  team?: string;
  viewMode?: "list" | "grid" | "teams";
}) {
  const { sessionToken } = useCurrentUser();

  const users = useQuery(
    api.users.getUsers,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return { users: users?.users, isLoading: !users };
}

export function useUser(userId: string) {
  const { sessionToken } = useCurrentUser();

  const user = useQuery(
    api.users.getUser,
    sessionToken && userId
      ? {
          sessionToken,
          userId: userId as any,
        }
      : "skip"
  );

  return { user, isLoading: !user };
}

export function useCurrentUserDetails() {
  const { user, sessionToken } = useCurrentUser();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    sessionToken && user
      ? {
          sessionToken,
          userId: user._id as any,
        }
      : "skip"
  );

  return { currentUser, isLoading: !currentUser };
}

export function useCreateUser() {
  const { sessionToken } = useCurrentUser();
  const createUser = useMutation(api.users.createUser);

  const handleCreateUser = async (data: {
    email: string;
    name: string;
    role: "admin" | "project_manager" | "team_lead" | "member" | "client";
    avatar?: string;
    workingHours?: {
      start: string;
      end: string;
      timezone: string;
    };
    team?: string;
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createUser({
      sessionToken,
      ...data,
    });
  };

  return { createUser: handleCreateUser };
}

export function useUpdateUser() {
  const { sessionToken } = useCurrentUser();
  const updateUser = useMutation(api.users.updateUser);

  const handleUpdateUser = async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: "admin" | "project_manager" | "team_lead" | "member" | "client";
      avatar?: string;
      workingHours?: {
        start: string;
        end: string;
        timezone: string;
      };
      team?: string;
      isActive?: boolean;
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateUser({
      sessionToken,
      userId: userId as any,
      ...data,
    });
  };

  return { updateUser: handleUpdateUser };
}

export function useTeams() {
  const { sessionToken } = useCurrentUser();

  const teams = useQuery(
    api.users.getTeams,
    sessionToken ? { sessionToken } : "skip"
  );

  return { teams, isLoading: !teams };
}

export function useCreateTeam() {
  const { sessionToken } = useCurrentUser();
  const createTeam = useMutation(api.users.createTeam);

  const handleCreateTeam = async (data: {
    name: string;
    color: string;
    description?: string;
    leadId?: string;
    memberIds?: string[];
  }) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await createTeam({
      sessionToken,
      ...data,
    });
  };

  return { createTeam: handleCreateTeam };
}

export function useUpdateTeam() {
  const { sessionToken } = useCurrentUser();
  const updateTeam = useMutation(api.users.updateTeam);

  const handleUpdateTeam = async (
    teamId: string,
    data: {
      name?: string;
      color?: string;
      description?: string;
      leadId?: string;
      memberIds?: string[];
    }
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await updateTeam({
      sessionToken,
      teamId: teamId as any,
      ...data,
    });
  };

  return { updateTeam: handleUpdateTeam };
}

export function useDeleteTeam() {
  const { sessionToken } = useCurrentUser();
  const deleteTeam = useMutation(api.users.deleteTeam);

  const handleDeleteTeam = async (teamId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await deleteTeam({
      sessionToken,
      teamId: teamId as any,
    });
  };

  return { deleteTeam: handleDeleteTeam };
}

export function useUserStats() {
  const { sessionToken } = useCurrentUser();

  const stats = useQuery(
    api.users.getUserStats,
    sessionToken ? { sessionToken } : "skip"
  );

  return { stats, isLoading: !stats };
}

export function useUserActivity() {
  const { sessionToken } = useCurrentUser();

  const activity = useQuery(
    api.users.getUserActivity,
    sessionToken ? { sessionToken } : "skip"
  );

  return { activity, isLoading: !activity };
}
