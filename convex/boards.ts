import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_BOARD_NAME = "Project Dashboard";
const DEFAULT_COLUMNS = [
  { title: "To Do", order: 0 },
  { title: "In Progress", order: 1 },
  { title: "Done", order: 2 },
];

async function createBoard(ctx: any, tenantId: string) {
  const now = new Date().toISOString();
  return await ctx.db.insert("boards", {
    tenantId,
    name: DEFAULT_BOARD_NAME,
    createdAt: now,
    updatedAt: now,
  });
}

async function createDefaultColumns(
  ctx: any,
  tenantId: string,
  boardId: string
) {
  const now = new Date().toISOString();
  const columnPromises = DEFAULT_COLUMNS.map((column) =>
    ctx.db.insert("columns", {
      tenantId,
      boardId,
      title: column.title,
      order: column.order,
      createdAt: now,
      updatedAt: now,
    })
  );
  await Promise.all(columnPromises);
}

export const createBoardIfNotExists = mutation({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    if (
      !args.tenantId ||
      typeof args.tenantId !== "string" ||
      args.tenantId.trim() === ""
    ) {
      throw new Error("Invalid tenantId: must be a non-empty string");
    }

    try {
      const existingBoard = await ctx.db
        .query("boards")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .first();

      if (existingBoard) {
        return { boardId: existingBoard._id, created: false };
      }

      const boardId = await createBoard(ctx, args.tenantId);

      await createDefaultColumns(ctx, args.tenantId, boardId);

      return { boardId, created: true };
    } catch (error) {
      console.error("Error in createBoardIfNotExists:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create board: ${message}`);
    }
  },
});

export const getBoardWithData = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    if (
      !args.tenantId ||
      typeof args.tenantId !== "string" ||
      args.tenantId.trim() === ""
    ) {
      throw new Error("Invalid tenantId: must be a non-empty string");
    }

    try {
      const board = await ctx.db
        .query("boards")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .first();

      if (!board) {
        throw new Error(
          "Board not found. Please create the board first using createBoardIfNotExists mutation."
        );
      }

      const [columns, tasks] = await Promise.all([
        ctx.db
          .query("columns")
          .withIndex("by_board", (q) => q.eq("boardId", board._id))
          .order("asc")
          .collect(),
        ctx.db
          .query("tasks")
          .withIndex("by_board", (q) => q.eq("boardId", board._id))
          .order("desc")
          .collect(),
      ]);

      const columnsWithTasks = columns.map((column) => {
        const columnTasks = tasks
          .filter((task) => task.columnId === column._id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        return {
          ...column,
          taskIds: columnTasks.map((task) => task._id),
        };
      });

      return {
        id: board._id,
        name: board.name,
        columns: columnsWithTasks,
        tasks,
      };
    } catch (error) {
      console.error("Error in getBoardWithData:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get board data: ${message}`);
    }
  },
});
