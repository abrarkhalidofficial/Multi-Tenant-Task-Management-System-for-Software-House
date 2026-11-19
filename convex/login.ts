import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const authenticateAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found. Please check your email.");
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      throw new Error("Access denied. Admin role required.");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact administrator.");
    }

    // Get the stored credentials
    const credentials = await ctx.db
      .query("userCredentials")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!credentials) {
      throw new Error("Credentials not found. Please contact administrator.");
    }

    // Verify the password (in production, use proper password hashing!)
    if (credentials.passwordHash !== password) {
      throw new Error("Invalid password. Please try again.");
    }

    // Return user info
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
    };
  },
});
export const checkAnyAdminExists = query({
  handler: async (ctx) => {
    // Get all tenants first
    const allTenants = await ctx.db.query("tenants").collect();

    let anyAdminExists = false;

    // Check each tenant for admin users
    for (const tenant of allTenants) {
      const admins = await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", tenant._id).eq("role", "admin")
        )
        .collect();

      if (admins.length > 0) {
        anyAdminExists = true;
        break;
      }
    }

    return anyAdminExists;
  },
});
