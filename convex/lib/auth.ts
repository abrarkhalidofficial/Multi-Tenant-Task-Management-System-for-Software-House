import type { QueryCtx, MutationCtx } from "./_generated/server"
import { ConvexError } from "convex/values"
import type { Id } from "./_generated/dataModel"

export type UserRole = "Admin" | "ProjectManager" | "TeamLead" | "Member" | "Client"

export interface AuthenticatedUser {
  _id: Id<"users">
  tenantId: Id<"tenants">
  email: string
  name: string
  role: UserRole
}

/**
 * Require user authentication and specific role(s) for a given tenant
 */
export async function requireUserAndRole(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  allowedRoles: UserRole[],
): Promise<AuthenticatedUser> {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new ConvexError("Authentication required")
  }

  // Find user by email and tenant
  const user = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q) => q.eq("tenantId", tenantId).eq("email", identity.email!))
    .unique()

  if (!user) {
    throw new ConvexError("User not found in this tenant")
  }

  if (!user.isActive) {
    throw new ConvexError("User account is inactive")
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ConvexError(`Insufficient permissions. Required: ${allowedRoles.join(", ")}`)
  }

  return user
}

/**
 * Get current authenticated user without role checking
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity?.email) {
    return null
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tenant_email", (q) => q.eq("email", identity.email!))
    .first()

  return user || null
}

/**
 * Check if user has permission for specific roles
 */
export function hasRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

/**
 * Role hierarchy for permission checking
 */
export function hasMinimumRole(user: AuthenticatedUser, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    Client: 1,
    Member: 2,
    TeamLead: 3,
    ProjectManager: 4,
    Admin: 5,
  }

  return roleHierarchy[user.role] >= roleHierarchy[minimumRole]
}
