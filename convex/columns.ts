import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tenantId: v.string(),
    boardId: v.id("boards"),
    title: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("columns", {
      tenantId: args.tenantId,
      boardId: args.boardId,
      title: args.title,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
  },
});
