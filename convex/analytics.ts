import { v } from "convex/values"
import { query } from "./_generated/server"
import { auth } from "./auth"

export const getProjectAnalytics = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Get all projects for tenant or specific project
    const projects = args.projectId
      ? [await ctx.db.get(args.projectId)]
      : await ctx.db
          .query("projects")
          .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
          .collect()

    const validProjects = projects.filter(Boolean)

    // Get all tasks for these projects
    const allTasks = await Promise.all(
      validProjects.map(async (project) => {
        if (!project) return []
        return await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
      }),
    )

    const tasks = allTasks.flat()

    // Calculate metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "done").length
    const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length
    const todoTasks = tasks.filter((task) => task.status === "todo").length
    const reviewTasks = tasks.filter((task) => task.status === "review").length

    const overdueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate < Date.now() && task.status !== "done",
    ).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Task distribution by priority
    const priorityDistribution = {
      urgent: tasks.filter((task) => task.priority === "urgent").length,
      high: tasks.filter((task) => task.priority === "high").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      low: tasks.filter((task) => task.priority === "low").length,
    }

    // Task distribution by status
    const statusDistribution = {
      todo: todoTasks,
      in_progress: inProgressTasks,
      review: reviewTasks,
      done: completedTasks,
    }

    // Project status distribution
    const projectStatusDistribution = {
      planning: validProjects.filter((p) => p?.status === "planning").length,
      active: validProjects.filter((p) => p?.status === "active").length,
      on_hold: validProjects.filter((p) => p?.status === "on_hold").length,
      completed: validProjects.filter((p) => p?.status === "completed").length,
      cancelled: validProjects.filter((p) => p?.status === "cancelled").length,
    }

    // Calculate average task completion time
    const completedTasksWithDates = tasks.filter((task) => task.status === "done" && task.createdAt && task.updatedAt)
    const avgCompletionTime =
      completedTasksWithDates.length > 0
        ? completedTasksWithDates.reduce((sum, task) => sum + (task.updatedAt - task.createdAt), 0) /
          completedTasksWithDates.length
        : 0

    return {
      overview: {
        totalProjects: validProjects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60 * 24)), // Convert to days
      },
      distributions: {
        priority: priorityDistribution,
        status: statusDistribution,
        projectStatus: projectStatusDistribution,
      },
    }
  },
})

export const getTeamAnalytics = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Get all users in tenant
    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect()

    // Get all tasks for tenant
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect()

    // Calculate metrics per user
    const userMetrics = await Promise.all(
      users.map(async (user) => {
        const userTasks = tasks.filter((task) => task.assigneeId === user._id)
        const completedTasks = userTasks.filter((task) => task.status === "done")
        const overdueTasks = userTasks.filter(
          (task) => task.dueDate && task.dueDate < Date.now() && task.status !== "done",
        )

        const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          completionRate: Math.round(completionRate * 100) / 100,
        }
      }),
    )

    return {
      teamSize: users.length,
      userMetrics: userMetrics.sort((a, b) => b.completionRate - a.completionRate),
    }
  },
})

export const getTimeAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
    const endDate = args.endDate || Date.now()

    // Get tasks created in date range
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect()

    // Get activity logs in date range
    const activities = await ctx.db
      .query("activityLogs")
      .withIndex("by_tenant_created", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect()

    // Group tasks by day
    const tasksByDay: Record<string, number> = {}
    const completedTasksByDay: Record<string, number> = {}

    tasks.forEach((task) => {
      const day = new Date(task.createdAt).toISOString().split("T")[0]
      tasksByDay[day] = (tasksByDay[day] || 0) + 1

      if (task.status === "done" && task.updatedAt >= startDate && task.updatedAt <= endDate) {
        const completedDay = new Date(task.updatedAt).toISOString().split("T")[0]
        completedTasksByDay[completedDay] = (completedTasksByDay[completedDay] || 0) + 1
      }
    })

    // Group activities by day
    const activitiesByDay: Record<string, number> = {}
    activities.forEach((activity) => {
      const day = new Date(activity.createdAt).toISOString().split("T")[0]
      activitiesByDay[day] = (activitiesByDay[day] || 0) + 1
    })

    return {
      dateRange: { startDate, endDate },
      tasksByDay,
      completedTasksByDay,
      activitiesByDay,
      totalTasksCreated: tasks.length,
      totalActivities: activities.length,
    }
  },
})

export const getProductivityMetrics = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    // Get tasks for different time periods
    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect()

    const tasksLast30Days = allTasks.filter((task) => task.createdAt >= thirtyDaysAgo)
    const tasksLast7Days = allTasks.filter((task) => task.createdAt >= sevenDaysAgo)

    const completedLast30Days = allTasks.filter((task) => task.status === "done" && task.updatedAt >= thirtyDaysAgo)
    const completedLast7Days = allTasks.filter((task) => task.status === "done" && task.updatedAt >= sevenDaysAgo)

    // Calculate velocity (tasks completed per day)
    const velocity30Days = completedLast30Days.length / 30
    const velocity7Days = completedLast7Days.length / 7

    // Calculate cycle time (average time from creation to completion)
    const completedTasksWithTimes = completedLast30Days.filter((task) => task.createdAt && task.updatedAt)
    const avgCycleTime =
      completedTasksWithTimes.length > 0
        ? completedTasksWithTimes.reduce((sum, task) => sum + (task.updatedAt - task.createdAt), 0) /
          completedTasksWithTimes.length
        : 0

    return {
      velocity: {
        last30Days: Math.round(velocity30Days * 100) / 100,
        last7Days: Math.round(velocity7Days * 100) / 100,
        trend: velocity7Days > velocity30Days ? "up" : velocity7Days < velocity30Days ? "down" : "stable",
      },
      cycleTime: {
        avgDays: Math.round((avgCycleTime / (1000 * 60 * 60 * 24)) * 100) / 100,
        avgHours: Math.round((avgCycleTime / (1000 * 60 * 60)) * 100) / 100,
      },
      throughput: {
        last30Days: completedLast30Days.length,
        last7Days: completedLast7Days.length,
      },
      created: {
        last30Days: tasksLast30Days.length,
        last7Days: tasksLast7Days.length,
      },
    }
  },
})
