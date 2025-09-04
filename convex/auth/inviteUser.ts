import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"
import { ConvexError } from "convex/values"

export const inviteUser = mutation({
  args: {
    tenantId: v.id("tenants"),
    email: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("ProjectManager"),
      v.literal("TeamLead"),
      v.literal("Member"),
      v.literal("Client"),
    ),
  },
  handler: async (ctx, { tenantId, email, role }) => {
    // Only Admins and Project Managers can invite users
    const currentUser = await requireUserAndRole(ctx, tenantId, ["Admin", "ProjectManager"])

    // Check if user already exists in tenant
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) => q.eq("tenantId", tenantId).eq("email", email))
      .unique()

    if (existingUser) {
      throw new ConvexError("User already exists in this tenant")
    }

    // Check for existing pending invitation
    const existingInvite = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .first()

    if (existingInvite && existingInvite.expiresAt > Date.now()) {
      throw new ConvexError("Invitation already sent and still valid")
    }

    // Generate invitation token
    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

    // Create invitation
    const invitationId = await ctx.db.insert("invitations", {
      tenantId,
      email,
      role,
      invitedBy: currentUser._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    })

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId,
      userId: currentUser._id,
      action: "invited_user",
      entityType: "project",
      entityId: invitationId,
      details: {
        metadata: { email, role },
      },
      createdAt: Date.now(),
    })

    return { invitationId, token }
  },
})

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { token, name, password }) => {
    // Find valid invitation
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique()

    if (!invitation) {
      throw new ConvexError("Invalid invitation token")
    }

    if (invitation.expiresAt < Date.now()) {
      throw new ConvexError("Invitation has expired")
    }

    if (invitation.acceptedAt) {
      throw new ConvexError("Invitation already accepted")
    }

    // Create user account
    const userId = await ctx.db.insert("users", {
      tenantId: invitation.tenantId,
      email: invitation.email,
      name,
      role: invitation.role,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      acceptedAt: Date.now(),
    })

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: invitation.tenantId,
      userId,
      action: "accepted_invitation",
      entityType: "project",
      entityId: invitation._id,
      details: {
        metadata: { role: invitation.role },
      },
      createdAt: Date.now(),
    })

    return { userId, tenantId: invitation.tenantId }
  },
})
