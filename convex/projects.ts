import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  hasPermission,
  calculateProjectProgress,
  sanitizeContent,
} from "./utils";
import { Project, Task, User } from "./utils";

/**
 * Get project by ID
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - users can read projects in their tenant
    if (project.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access projects from other tenants");
    }

    // Get project owner details
    const owner = await ctx.db.get(project.ownerId);

    // Get team details if exists
    const team = project.teamId ? await ctx.db.get(project.teamId) : null;

    // Get member details
    const members = await Promise.all(
      project.memberIds.map((memberId) => ctx.db.get(memberId))
    );

    return {
      id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      deadline: project.deadline,
      owner: owner
        ? {
            id: owner._id,
            name: owner.name,
            email: owner.email,
            avatar: owner.avatar,
          }
        : null,
      team: team
        ? {
            id: team._id,
            name: team.name,
            color: team.color,
          }
        : null,
      members: members.filter(Boolean).map((member) => ({
        id: member._id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        role: member.role,
      })),
      tags: project.tags,
      isArchived: project.isArchived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
});

/**
 * Get all projects for current tenant
 */
export const getProjects = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("on_hold"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    ownerId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    const tenantId = currentUser.tenantId;
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get projects based on filters
    let projects = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    // Apply filters
    if (args.status) {
      projects = projects.filter((project) => project.status === args.status);
    }

    if (args.ownerId) {
      projects = projects.filter((project) => project.ownerId === args.ownerId);
    }

    if (args.teamId) {
      projects = projects.filter((project) => project.teamId === args.teamId);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      projects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchLower) ||
          (project.description &&
            project.description.toLowerCase().includes(searchLower))
      );
    }

    if (!args.includeArchived) {
      projects = projects.filter((project) => !project.isArchived);
    }

    // Get additional data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const owner = await ctx.db.get(project.ownerId);
        const team = project.teamId ? await ctx.db.get(project.teamId) : null;

        // Get task count and progress
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const taskCount = tasks.length;
        const completedTasks = tasks.filter(
          (task) => task.status === "done"
        ).length;
        const progress =
          taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate,
          endDate: project.endDate,
          deadline: project.deadline,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          team: team
            ? {
                id: team._id,
                name: team.name,
                color: team.color,
              }
            : null,
          taskCount,
          completedTasks,
          progress,
          tags: project.tags,
          isArchived: project.isArchived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    const total = projectsWithData.length;
    const paginatedProjects = projectsWithData.slice(offset, offset + limit);

    return {
      projects: paginatedProjects,
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Create new project
 */
export const createProject = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
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
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
    memberIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Check permissions - project_manager or admin can create projects
    if (!hasPermission(currentUser.role, "project", "create")) {
      throw new Error("Insufficient permissions");
    }

    // Check tenant limits
    const projectCount = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()
      .then((projects) => projects.length);

    const tenant = await ctx.db.get(currentUser.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    if (projectCount >= tenant.settings.maxProjects) {
      throw new Error("Project limit reached for this tenant");
    }

    // Validate team membership if teamId provided
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.tenantId !== currentUser.tenantId) {
        throw new Error("Invalid team");
      }
    }

    // Validate member IDs
    if (args.memberIds && args.memberIds.length > 0) {
      const members = await Promise.all(
        args.memberIds.map((memberId) => ctx.db.get(memberId))
      );

      const invalidMembers = members.filter(
        (member) => !member || member.tenantId !== currentUser.tenantId
      );

      if (invalidMembers.length > 0) {
        throw new Error("Invalid member IDs");
      }
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      tenantId: currentUser.tenantId,
      name: sanitizeContent(args.name),
      description: args.description
        ? sanitizeContent(args.description)
        : undefined,
      status: args.status || "planning",
      priority: args.priority || "medium",
      startDate: args.startDate,
      endDate: args.endDate,
      deadline: args.deadline,
      ownerId: currentUser._id,
      teamId: args.teamId,
      memberIds: args.memberIds || [],
      tags: args.tags || [],
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "created_project",
      resourceType: "project",
      resourceId: projectId.toString(),
      changes: {
        before: null,
        after: { name: args.name },
      },
      createdAt: Date.now(),
    });

    return {
      projectId,
      success: true,
    };
  },
});

/**
 * Update project
 */
export const updateProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("projects"),
    name: v.optional(v.string()),
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
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
    memberIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    const isOwner = project.ownerId === currentUser._id;
    const canUpdate = hasPermission(
      currentUser.role,
      "project",
      "update",
      isOwner
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Ensure project belongs to user's tenant
    if (project.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot update projects from other tenants");
    }

    // Validate team membership if teamId provided
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.tenantId !== currentUser.tenantId) {
        throw new Error("Invalid team");
      }
    }

    // Validate member IDs
    if (args.memberIds && args.memberIds.length > 0) {
      const members = await Promise.all(
        args.memberIds.map((memberId) => ctx.db.get(memberId))
      );

      const invalidMembers = members.filter(
        (member) => !member || member.tenantId !== currentUser.tenantId
      );

      if (invalidMembers.length > 0) {
        throw new Error("Invalid member IDs");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = sanitizeContent(args.name);
    if (args.description !== undefined)
      updateData.description = args.description
        ? sanitizeContent(args.description)
        : undefined;
    if (args.status) updateData.status = args.status;
    if (args.priority) updateData.priority = args.priority;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.deadline !== undefined) updateData.deadline = args.deadline;
    if (args.teamId !== undefined) updateData.teamId = args.teamId;
    if (args.memberIds !== undefined) updateData.memberIds = args.memberIds;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.projectId, updateData);

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "updated_project",
      resourceType: "project",
      resourceId: args.projectId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Archive project
 */
export const archiveProject = mutation({
  args: {
    sessionToken: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    const isOwner = project.ownerId === currentUser._id;
    const canUpdate = hasPermission(
      currentUser.role,
      "project",
      "update",
      isOwner
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Ensure project belongs to user's tenant
    if (project.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot update projects from other tenants");
    }

    await ctx.db.patch(args.projectId, {
      isArchived: true,
      status: "archived",
      updatedAt: Date.now(),
    });

    // Archive all tasks in the project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      if (!task.isArchived) {
        await ctx.db.patch(task._id, {
          isArchived: true,
          updatedAt: Date.now(),
        });
      }
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "archived_project",
      resourceType: "project",
      resourceId: args.projectId.toString(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get projects by status
 */
export const getProjectsByStatus = query({
  args: {
    sessionToken: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get projects by status
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();

    // Get owner details for each project
    const projectsWithOwners = await Promise.all(
      projects.map(async (project) => {
        const owner = await ctx.db.get(project.ownerId);
        return {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate,
          endDate: project.endDate,
          deadline: project.deadline,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          tags: project.tags,
          isArchived: project.isArchived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    return projectsWithOwners;
  },
});

/**
 * Get user's projects
 */
export const getUserProjects = query({
  args: {
    sessionToken: v.string(),
    userId: v.optional(v.id("users")),
    includeMember: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    const targetUserId = args.userId || currentUser._id;

    // Check permissions
    if (targetUserId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("Invalid user");
    }

    // Get projects where user is owner
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", targetUserId))
      .filter((q) => q.eq(q.field("tenantId"), currentUser.tenantId))
      .collect();

    let projects = ownedProjects;

    // Also get projects where user is member if requested
    if (args.includeMember) {
      const allProjects = await ctx.db
        .query("projects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
        .collect();

      const memberProjects = allProjects.filter((project) =>
        project.memberIds.includes(targetUserId)
      );

      // Combine and deduplicate
      const projectIds = new Set(ownedProjects.map((p) => p._id.toString()));
      memberProjects.forEach((project) => {
        if (!projectIds.has(project._id.toString())) {
          projects.push(project);
        }
      });
    }

    // Get additional data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const owner = await ctx.db.get(project.ownerId);
        const team = project.teamId ? await ctx.db.get(project.teamId) : null;

        // Get task count and progress
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const taskCount = tasks.length;
        const completedTasks = tasks.filter(
          (task) => task.status === "done"
        ).length;
        const progress =
          taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate,
          endDate: project.endDate,
          deadline: project.deadline,
          owner: owner
            ? {
                id: owner._id,
                name: owner.name,
                email: owner.email,
                avatar: owner.avatar,
              }
            : null,
          team: team
            ? {
                id: team._id,
                name: team.name,
                color: team.color,
              }
            : null,
          taskCount,
          completedTasks,
          progress,
          tags: project.tags,
          isArchived: project.isArchived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    return projectsWithData;
  },
});

/**
 * Get project templates
 */
export const getProjectTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get templates for the tenant
    let templates = await ctx.db
      .query("projectTemplates")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by category if provided
    if (args.category) {
      templates = templates.filter(
        (template) => template.category === args.category
      );
    }

    return templates;
  },
});

/**
 * Create project from template
 */
export const createProjectFromTemplate = mutation({
  args: {
    sessionToken: v.string(),
    templateId: v.id("projectTemplates"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Check permissions
    if (!hasPermission(currentUser.role, "project", "create")) {
      throw new Error("Insufficient permissions");
    }

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template || template.tenantId !== currentUser.tenantId) {
      throw new Error("Template not found");
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      tenantId: currentUser.tenantId,
      name: sanitizeContent(args.name),
      description: args.description
        ? sanitizeContent(args.description)
        : template.description,
      status: "planning",
      priority: "medium",
      startDate: args.startDate,
      endDate: undefined,
      deadline: undefined,
      ownerId: currentUser._id,
      teamId: args.teamId,
      memberIds: args.memberIds || [],
      tags: [],
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create tasks from template
    for (const taskTemplate of template.taskTemplates) {
      await ctx.db.insert("tasks", {
        tenantId: currentUser.tenantId,
        projectId,
        name: taskTemplate.name,
        description: taskTemplate.description,
        status: "todo",
        priority: taskTemplate.priority,
        assigneeIds: [],
        reporterId: currentUser._id,
        dueDate: undefined,
        startDate: undefined,
        completedAt: undefined,
        estimatedHours: taskTemplate.estimatedHours,
        actualHours: undefined,
        tags: [],
        attachments: [],
        subtasks: [],
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      action: "created_project_from_template",
      resourceType: "project",
      resourceId: projectId.toString(),
      changes: {
        before: null,
        after: { name: args.name, templateId: args.templateId },
      },
      createdAt: Date.now(),
    });

    return {
      projectId,
      success: true,
    };
  },
});
