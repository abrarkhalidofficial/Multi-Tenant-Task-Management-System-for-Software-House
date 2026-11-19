import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (existingTenant) {
      throw new Error("Tenant slug already exists")
    }

    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return tenantId
  },
})

export const getTenantBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()
  },
})

export const updateTenantSettings = mutation({
  args: {
    tenantId: v.id("tenants"),
    settings: v.object({
      branding: v.optional(
        v.object({
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      settings: args.settings,
      updatedAt: Date.now(),
    })
  },
})
