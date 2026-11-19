import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const initializeAdmin = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@gmail.com"))
      .first();

    if (existingAdmin) {
      return {
        message: "Admin user already exists",
        userId: existingAdmin._id,
      };
    }

    // First, check if we have a tenant to assign the admin to
    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "main-tenant"))
      .first();

    // If no tenant exists, create one
    if (!tenant) {
      const tenantId = await ctx.db.insert("tenants", {
        name: "Main Tenant",
        slug: "main-tenant",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      tenant = await ctx.db.get(tenantId);
    }

    // Create the admin user
    const userId = await ctx.db.insert("users", {
      email: "admin@gmail.com",
      name: "System Administrator",
      tenantId: tenant ? tenant._id : null,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // In a real application, you would hash the password here
    // For now, we'll just store it in a simple way (not secure for production)
    // You might want to create a separate table for credentials

    return {
      message: "Admin user created successfully",
      userId,
      email: "admin@gmail.com",
      password: args.password, // Just for demonstration, don't do this in production
    };
  },
});
