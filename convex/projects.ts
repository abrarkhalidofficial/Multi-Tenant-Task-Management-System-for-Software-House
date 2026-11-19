import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, requireProjectAccess } from "./middleware";

// Get all projects for the current user's tenant
export const getProjects = query({
  handler: async (ctx) => {
    const { user } = await requirePermission(ctx, "projects.view");

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", user.tenantId))
      .collect();

    // Get project managers
    const managerIds = [...new Set(projects.map((p) => p.managerId))];
    const managers = await Promise.all(
      managerIds.map((id) => ctx.db.get(id))
    );
    const managersMap = new Map(
      managers.filter(Boolean).map((m) => [m!._id, m])
    );

    return projects.map((project) => ({
      id: project._id,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      manager: managersMap.get(project.managerId) ? {
        id: managersMap.get(project.managerId)!._id,
        name: managersMap.get(project.managerId)!.name,
        email: managersMap.get(project.managerId)!.email,
      } : null,
      teamMembersCount: project.teamMembers.length,
      tags: project.tags,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  },
});

// Get a specific project
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    // Get project manager
    const manager = await ctx.db.get(project.managerId);

    // Get team members
    const teamMembers = await Promise.all(
      project.teamMembers.map((id) => ctx.db.get(id))
    );

    // Get client if exists
    const client = project.clientId ? await ctx.db.get(project.clientId) : null;

    return {
      id: project._id,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      manager: manager ? {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      } : null,
      teamMembers: teamMembers.filter(Boolean).map((member) => ({
        id: member!._id,
        name: member!.name,
        email: member!.email,
        role: member!.role,
      })),
      client: client ? {
        id: client._id,
        name: client.name,
        email: client.email,
      } : null,
      budget: project.budget,
      actualCost: project.actualCost,
      tags: project.tags,
      customFields: project.customFields,
      taskStatuses: project.taskStatuses,
      createdById: project.createdById,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
});

// Create a new project
export const createProject = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    managerId: v.id("users"),
    teamMembers: v.array(v.id("users")),
    clientId: v.optional(v.id("users")),
    budget: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(
            v.literal("text"),
            v.literal("number"),
            v.literal("date"),
            v.literal("select"),
            v.literal("checkbox")
          ),
          value: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "projects.create");

    // Validate manager exists and is in the same tenant
    const manager = await ctx.db.get(args.managerId);
    if (!manager || manager.tenantId !== user.tenantId) {
      throw new ConvexError("Invalid project manager");
    }

    // Validate team members exist and are in the same tenant
    for (const memberId of args.teamMembers) {
      const member = await ctx.db.get(memberId);
      if (!member || member.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid team member");
      }
    }

    // Validate client if provided
    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client || client.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid client");
      }
    }

    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      status: "planning",
      priority: args.priority,
      startDate: args.startDate,
      endDate: args.endDate,
      deadline: args.deadline,
      tenantId: user.tenantId,
      managerId: args.managerId,
      teamMembers: args.teamMembers,
      clientId: args.clientId,
      budget: args.budget,
      actualCost: 0,
      tags: args.tags || [],
      customFields: args.customFields || [],
      taskStatuses: [
        { id: "todo", name: "To Do", color: "#6b7280", order: 0 },
        { id: "in_progress", name: "In Progress", color: "#3b82f6", order: 1 },
        { id: "review", name: "Review", color: "#f59e0b", order: 2 },
        { id: "done", name: "Done", color: "#10b981", order: 3 },
      ],
      createdById: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "project",
      entityId: projectId,
      action: "created",
      details: {
        description: `${user.name} created project "${args.title}"`,
      },
      createdAt: Date.now(),
    });

    return {
      projectId,
      message: `Project "${args.title}" created successfully`,
    };
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("on_hold"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    teamMembers: v.optional(v.array(v.id("users"))),
    clientId: v.optional(v.id("users")),
    budget: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.union(
            v.literal("text"),
            v.literal("number"),
            v.literal("date"),
            v.literal("select"),
            v.literal("checkbox")
          ),
          value: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    // Validate manager if provided
    if (args.managerId) {
      const manager = await ctx.db.get(args.managerId);
      if (!manager || manager.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid project manager");
      }
    }

    // Validate team members if provided
    if (args.teamMembers) {
      for (const memberId of args.teamMembers) {
        const member = await ctx.db.get(memberId);
        if (!member || member.tenantId !== user.tenantId) {
          throw new ConvexError("Invalid team member");
        }
      }
    }

    // Validate client if provided
    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client || client.tenantId !== user.tenantId) {
        throw new ConvexError("Invalid client");
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Only include fields that are provided
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.managerId !== undefined) updates.managerId = args.managerId;
    if (args.teamMembers !== undefined) updates.teamMembers = args.teamMembers;
    if (args.clientId !== undefined) updates.clientId = args.clientId;
    if (args.budget !== undefined) updates.budget = args.budget;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.customFields !== undefined) updates.customFields = args.customFields;

    await ctx.db.patch(args.projectId, updates);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "updated",
      details: {
        description: `${user.name} updated project "${project.title}"`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Project updated successfully" };
  },
});

// Delete a project
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);

    // Check if user has permission to delete projects
    if (!["admin", "project_manager"].includes(user.role)) {
      throw new ConvexError("Unauthorized: You don't have permission to delete projects");
    }

    // Check if project has tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (tasks.length > 0) {
      throw new ConvexError("Cannot delete project with existing tasks. Archive the project instead.");
    }

    await ctx.db.delete(args.projectId);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: user.tenantId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "deleted",
      details: {
        description: `${user.name} deleted project "${project.title}"`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Project deleted successfully" };
  },
});