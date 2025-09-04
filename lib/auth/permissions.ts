// Permission checking utilities for role-based access control

import { type UserRole, type Permission, ROLE_PERMISSIONS } from "../types/database"

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions.includes(permission as any)
}

export function canManageProject(userRole: UserRole, userId: string, projectManagerId: string): boolean {
  if (hasPermission(userRole, "manage_all_projects")) {
    return true
  }

  if (hasPermission(userRole, "manage_assigned_projects") && userId === projectManagerId) {
    return true
  }

  return false
}

export function canManageTask(
  userRole: UserRole,
  userId: string,
  taskAssigneeIds: string[],
  projectManagerId: string,
): boolean {
  if (hasPermission(userRole, "manage_all_tasks")) {
    return true
  }

  if (hasPermission(userRole, "manage_assigned_projects") && userId === projectManagerId) {
    return true
  }

  if (hasPermission(userRole, "manage_team_tasks") && taskAssigneeIds.includes(userId)) {
    return true
  }

  return false
}

export function canViewProject(
  userRole: UserRole,
  userId: string,
  projectManagerId: string,
  teamIds: string[],
  clientId?: string,
): boolean {
  if (hasPermission(userRole, "manage_all_projects")) {
    return true
  }

  if (userId === projectManagerId || teamIds.includes(userId)) {
    return true
  }

  if (clientId && userId === clientId && hasPermission(userRole, "view_assigned_projects")) {
    return true
  }

  return false
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  project_manager: 4,
  team_lead: 3,
  member: 2,
  client: 1,
}

export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[assignerRole] > ROLE_HIERARCHY[targetRole]
}
