import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActivity = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (!board) {
      return [];
    }

    const activity = await ctx.db
      .query("activity")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .order("desc")
      .take(50);

    return activity;
  },
});

export const createActivity = mutation({
  args: {
    tenantId: v.string(),
    type: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("moved"),
      v.literal("deleted")
    ),
    taskId: v.id("tasks"),
    taskTitle: v.string(),
    details: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    if (!board) {
      throw new Error("No board found");
    }

    const activityId = await ctx.db.insert("activity", {
      tenantId: args.tenantId,
      boardId: board._id,
      taskId: args.taskId,
      type: args.type,
      taskTitle: args.taskTitle,
      details: args.details,
      timestamp: args.timestamp,
    });

    return activityId;
  },
});
