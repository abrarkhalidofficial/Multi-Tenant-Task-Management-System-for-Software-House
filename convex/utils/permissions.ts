import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Define role types
export type UserRole =
  | "admin"
  | "project_manager"
  | "team_lead"
  | "member"
  | "client";

// Define permission types
export type Permission =
  // Tenant permissions
  | "tenant.view"
  | "tenant.edit"
  // User permissions
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Project permissions
  | "projects.view"
  | "projects.create"
  | "projects.edit"
  | "projects.delete"
  // Task permissions
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.delete"
  | "tasks.assign"
  // Comment permissions
  | "comments.view"
  | "comments.create"
  | "comments.edit"
  | "comments.delete"
  // File permissions
  | "files.view"
  | "files.upload"
  | "files.delete"
  // Time tracking permissions
  | "time.track"
  | "time.view_own"
  | "time.view_all"
  | "time.edit_own"
  | "time.edit_all"
  // Report permissions
  | "reports.view"
  | "reports.create"
  | "reports.edit"
  | "reports.delete";

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    "tenant.view",
    "tenant.edit",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "projects.view",
    "projects.create",
    "projects.edit",
    "projects.delete",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.assign",
    "comments.view",
    "comments.create",
    "comments.edit",
    "comments.delete",
    "files.view",
    "files.upload",
    "files.delete",
    "time.track",
    "time.view_own",
    "time.view_all",
    "time.edit_own",
    "time.edit_all",
    "reports.view",
    "reports.create",
    "reports.edit",
    "reports.delete",
  ],
  project_manager: [
    "tenant.view",
    "users.view",
    "users.create",
    "users.edit",
    "projects.view",
    "projects.create",
    "projects.edit",
    "projects.delete",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.assign",
    "comments.view",
    "comments.create",
    "comments.edit",
    "comments.delete",
    "files.view",
    "files.upload",
    "files.delete",
    "time.track",
    "time.view_own",
    "time.view_all",
    "time.edit_own",
    "time.edit_all",
    "reports.view",
    "reports.create",
    "reports.edit",
    "reports.delete",
  ],
  team_lead: [
    "tenant.view",
    "users.view",
    "projects.view",
    "projects.create",
    "projects.edit",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.assign",
    "comments.view",
    "comments.create",
    "comments.edit",
    "comments.delete",
    "files.view",
    "files.upload",
    "files.delete",
    "time.track",
    "time.view_own",
    "time.view_all",
    "time.edit_own",
    "reports.view",
    "reports.create",
  ],
  member: [
    "tenant.view",
    "users.view",
    "projects.view",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "comments.view",
    "comments.create",
    "comments.edit",
    "files.view",
    "files.upload",
    "time.track",
    "time.view_own",
    "time.edit_own",
    "reports.view",
  ],
  client: [
    "tenant.view",
    "projects.view",
    "tasks.view",
    "comments.view",
    "comments.create",
    "files.view",
    "reports.view",
  ],
};

// Helper function to check if a user has a specific permission
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return rolePermissions[userRole].includes(permission);
}

// Helper function to get the current authenticated user
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const userId = await ctx.auth.getUserId();
  if (!userId) {
    throw new ConvexError("Unauthorized: Please sign in");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_id", (q) => q.eq("authId", userId))
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  if (!user.isActive) {
    throw new ConvexError(
      "Account is deactivated. Please contact administrator."
    );
  }

  return user;
}

// Helper function to check if a user has access to a tenant
export async function validateTenantAccess(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">
) {
  const user = await getAuthenticatedUser(ctx);

  if (user.tenantId !== tenantId) {
    throw new ConvexError("Unauthorized: You don't have access to this tenant");
  }

  return user;
}

// Helper function to check if a user has a specific permission within their tenant
export async function validatePermission(
  ctx: QueryCtx | MutationCtx,
  permission: Permission
) {
  const user = await getAuthenticatedUser(ctx);

  if (!hasPermission(user.role as UserRole, permission)) {
    throw new ConvexError(
      `Unauthorized: You don't have the ${permission} permission`
    );
  }

  return user;
}

// Helper function to check if a user has access to a project
export async function validateProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">
) {
  const user = await getAuthenticatedUser(ctx);

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new ConvexError("Project not found");
  }

  if (project.tenantId !== user.tenantId) {
    throw new ConvexError(
      "Unauthorized: You don't have access to this project"
    );
  }

  return { user, project };
}

// Helper function to check if a user has access to a task
export async function validateTaskAccess(
  ctx: QueryCtx | MutationCtx,
  taskId: Id<"tasks">
) {
  const user = await getAuthenticatedUser(ctx);

  const task = await ctx.db.get(taskId);
  if (!task) {
    throw new ConvexError("Task not found");
  }

  const project = await ctx.db.get(task.projectId);
  if (!project) {
    throw new ConvexError("Project not found");
  }

  if (project.tenantId !== user.tenantId) {
    throw new ConvexError("Unauthorized: You don't have access to this task");
  }

  return { user, task, project };
}
