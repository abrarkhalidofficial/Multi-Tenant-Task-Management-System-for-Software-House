import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"
import { ConvexError } from "convex/values"

export const createProject = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    dueDate: v.optional(v.number()),
    managerId: v.id("users"),
    teamMembers: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Only Admins and Project Managers can create projects
    const currentUser = await requireUserAndRole(ctx, args.tenantId, ["Admin", "ProjectManager"])

    // Verify manager exists and has appropriate role
    const manager = await ctx.db.get(args.managerId)
    if (!manager || manager.tenantId !== args.tenantId) {
      throw new ConvexError("Invalid project manager")
    }

    if (!["Admin", "ProjectManager", "TeamLead"].includes(manager.role)) {
      throw new ConvexError("Manager must have ProjectManager or TeamLead role")
    }

    // Verify all team members exist and belong to tenant
    for (const memberId of args.teamMembers) {
      const member = await ctx.db.get(memberId)
      if (!member || member.tenantId !== args.tenantId) {
        throw new ConvexError("Invalid team member")
      }
    }

    const projectId = await ctx.db.insert("projects", {
      ...args,
      status: "Planning",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Initialize project stats
    await ctx.db.insert("projectStats", {
      tenantId: args.tenantId,
      projectId,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      lastUpdated: Date.now(),
    })

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: args.tenantId,
      userId: currentUser._id,
      action: "created_project",
      entityType: "project",
      entityId: projectId,
      details: {
        after: { title: args.title, managerId: args.managerId },
      },
      createdAt: Date.now(),
    })

    // Notify team members
    for (const memberId of args.teamMembers) {
      await ctx.db.insert("notifications", {
        tenantId: args.tenantId,
        userId: memberId,
        type: "project_updated",
        title: "Added to Project",
        message: `You've been added to project: ${args.title}`,
        entityType: "project",
        entityId: projectId,
        isRead: false,
        createdAt: Date.now(),
      })
    }

    return projectId
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("Planning"),
        v.literal("Active"),
        v.literal("OnHold"),
        v.literal("Completed"),
        v.literal("Archived"),
      ),
    ),
    priority: v.optional(v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"))),
    dueDate: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    teamMembers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { projectId, ...updates }) => {
    const project = await ctx.db.get(projectId)
    if (!project) {
      throw new ConvexError("Project not found")
    }

    // Check permissions
    const currentUser = await requireUserAndRole(ctx, project.tenantId, ["Admin", "ProjectManager", "TeamLead"])

    // Team leads can only update projects they manage
    if (currentUser.role === "TeamLead" && project.managerId !== currentUser._id) {
      throw new ConvexError("Team leads can only update projects they manage")
    }

    const before = { ...project }

    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    })

    // Log activity
    await ctx.db.insert("activityLogs", {
      tenantId: project.tenantId,
      userId: currentUser._id,
      action: "updated_project",
      entityType: "project",
      entityId: projectId,
      details: { before, after: updates },
      createdAt: Date.now(),
    })

    return projectId
  },
})
