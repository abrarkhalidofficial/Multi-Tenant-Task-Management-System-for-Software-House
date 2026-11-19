import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx, ActionCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { UserRole, hasPermission } from "./utils/permissions";

// Middleware for checking if a user is authenticated
export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<{ user: Doc<"users">; identity: any }> {
  const userId = await ctx.auth.getUserId();
  if (!userId) {
    throw new ConvexError("Unauthorized: Please sign in");
  }

  // Find the user by authId
  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_id", (q) => q.eq("authId", userId))
    .first();

  if (!user) {
    throw new ConvexError("User not found. Please register first.");
  }

  if (!user.isActive) {
    throw new ConvexError(
      "Account is deactivated. Please contact administrator."
    );
  }

  return { user, identity: { userId } };
}

// Middleware for checking if a user has a specific permission
export async function requirePermission(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  permission: string
): Promise<{ user: Doc<"users">; identity: any }> {
  const { user, identity } = await requireAuth(ctx);

  if (!hasPermission(user.role as UserRole, permission as any)) {
    throw new ConvexError(
      `Unauthorized: You don't have the ${permission} permission`
    );
  }

  return { user, identity };
}

// Middleware for checking if a user has access to a specific tenant
export async function requireTenantAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  tenantId: Id<"tenants">
): Promise<{ user: Doc<"users">; identity: any }> {
  const { user, identity } = await requireAuth(ctx);

  if (user.tenantId !== tenantId) {
    throw new ConvexError("Unauthorized: You don't have access to this tenant");
  }

  return { user, identity };
}

// Middleware for checking if a user has access to a specific project
export async function requireProjectAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  projectId: Id<"projects">
): Promise<{ user: Doc<"users">; project: Doc<"projects">; identity: any }> {
  const { user, identity } = await requireAuth(ctx);

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new ConvexError("Project not found");
  }

  if (project.tenantId !== user.tenantId) {
    throw new ConvexError(
      "Unauthorized: You don't have access to this project"
    );
  }

  return { user, project, identity };
}

// Middleware for checking if a user has access to a specific task
export async function requireTaskAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  taskId: Id<"tasks">
): Promise<{
  user: Doc<"users">;
  task: Doc<"tasks">;
  project: Doc<"projects">;
  identity: any;
}> {
  const { user, identity } = await requireAuth(ctx);

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

  return { user, task, project, identity };
}
