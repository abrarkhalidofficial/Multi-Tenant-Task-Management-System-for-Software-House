// Tenant-related utility functions

export function generateTenantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
}

export function validateTenantSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
}

export function getTenantFromDomain(domain: string): string | null {
  // For subdomain-based multi-tenancy (e.g., acme.taskapp.com)
  const parts = domain.split(".")
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}

export function buildTenantUrl(slug: string, baseUrl = "https://taskapp.com"): string {
  return `https://${slug}.${baseUrl.replace("https://", "")}`
}
