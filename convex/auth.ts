import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerWithTenant = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    companyName: v.string(),
    companySize: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password, name, companyName, companySize } = args;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create tenant first
    const tenantSlug = companyName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    // Check if tenant slug already exists
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
      .first();

    if (existingTenant) {
      throw new Error(
        "Company name is already taken. Please choose a different name."
      );
    }

    const tenantId = await ctx.db.insert("tenants", {
      name: companyName,
      slug: tenantSlug,
      settings: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create user with admin role
    const userId = await ctx.db.insert("users", {
      email,
      name,
      tenantId,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Store credentials in separate table
    await ctx.db.insert("userCredentials", {
      userId,
      passwordHash: password, // In production, you should hash this!
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId,
      tenantId,
      email,
      name,
      role: "admin",
      companyName,
      message: "Account created successfully! You can now sign in.",
    };
  },
});

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
    // Get all users and filter for admin role
    const allUsers = await ctx.db.query("users").collect();
    const admins = allUsers.filter((user) => user.role === "admin");

    return admins.length > 0;
  },
});
export const auth = query({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Here you would typically verify the password
    // For a real implementation, you should use proper password hashing and verification
    // This is just a basic example
    // For now, we'll assume the password is correct for the demo
    // In a real app, you would verify against a hashed password
    return user;
  },
});
export function getCurrentTime(): number {
  return Date.now();
}
