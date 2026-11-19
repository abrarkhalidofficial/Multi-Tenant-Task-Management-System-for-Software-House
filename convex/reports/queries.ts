import { query } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"

export const projectOverview = query({
  args: {
    tenantId: v.id("tenants"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { tenantId, projectId }) => {
    // Verify access
    await requireUserAndRole(ctx, tenantId, ["Admin", "ProjectManager", "TeamLead", "Member", "Client"])

    const project = await ctx.db.get(projectId)
    if (!project || project.tenantId !== tenantId) {
      throw new Error("Project not found")
    }

    // Get project stats
    const stats = await ctx.db
      .query("projectStats")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique()

    // Get tasks breakdown
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()

    const tasksByStatus = {
      ToDo: tasks.filter((t) => t.status === "ToDo").length,
      InProgress: tasks.filter((t) => t.status === "InProgress").length,
      Review: tasks.filter((t) => t.status === "Review").length,
      Done: tasks.filter((t) => t.status === "Done").length,
    }

    const tasksByPriority = {
      Low: tasks.filter((t) => t.priority === "Low").length,
      Medium: tasks.filter((t) => t.priority === "Medium").length,
      High: tasks.filter((t) => t.priority === "High").length,
    }

    // Get team performance
    const teamMembers = await Promise.all(
      project.teamMembers.map(async (memberId) => {
        const member = await ctx.db.get(memberId)
        const memberTasks = tasks.filter((t) => t.assignees.includes(memberId))
        const completedTasks = memberTasks.filter((t) => t.status === "Done")

        return {
          user: member
            ? {
                _id: member._id,
                name: member.name,
                email: member.email,
                role: member.role,
              }
            : null,
          totalTasks: memberTasks.length,
          completedTasks: completedTasks.length,
          completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
        }
      }),
    )

    return {
      project,
      stats,
      tasksByStatus,
      tasksByPriority,
      teamPerformance: teamMembers.filter((tm) => tm.user !== null),
    }
  },
})

export const tenantOverview = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, { tenantId }) => {
    await requireUserAndRole(ctx, tenantId, ["Admin", "ProjectManager", "TeamLead", "Member", "Client"])

    // Get all projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect()

    // Get all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect()

    // Calculate overall stats
    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.status === "Active").length
    const completedProjects = projects.filter((p) => p.status === "Completed").length

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "Done").length
    const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < Date.now() && t.status !== "Done").length

    const projectsByStatus = {
      Planning: projects.filter((p) => p.status === "Planning").length,
      Active: projects.filter((p) => p.status === "Active").length,
      OnHold: projects.filter((p) => p.status === "OnHold").length,
      Completed: projects.filter((p) => p.status === "Completed").length,
      Archived: projects.filter((p) => p.status === "Archived").length,
    }

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      projectsByStatus,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    }
  },
})
