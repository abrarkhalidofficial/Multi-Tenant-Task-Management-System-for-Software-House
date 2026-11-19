# Convex Integration Guide

This document explains how the Next.js frontend is integrated with the Convex backend for the Multi-Tenant Task Management System.

## Overview

The integration provides:

- ✅ Real-time data synchronization
- ✅ Role-based access control
- ✅ Type-safe API calls
- ✅ Authentication integration
- ✅ Optimistic updates

## Setup

### 1. Convex Client Installation

Convex is already installed in the project:

```json
{
  "convex": "latest",
  "@convex-dev/auth": "latest"
}
```

### 2. Convex Configuration

The `convex.json` file configures the Convex functions directory:

```json
{
  "functions": "convex/",
  "generateCommonJSApi": true
}
```

### 3. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment-name
```

## Integration Components

### 1. Convex Provider Setup

Located in `app/layout.tsx`:

```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import convex from "@/lib/convex";

export default function RootLayout({ children }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexProvider>
  );
}
```

### 2. Convex Client Configuration

Located in `lib/convex.ts`:

```ts
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
export default convex;
```

### 3. Generated API Files

- `api.ts` - Exports the typed API interface
- `react.ts` - Exports React hooks (useQuery, useMutation, etc.)

## Real-Time Synchronization

Convex automatically provides real-time updates for all queries. When data changes in the database, all active queries update automatically without manual polling.

### Example: Real-Time Task Updates

```tsx
export function TaskList({ projectId }: { projectId: Id<"projects"> }) {
  // This query automatically updates when tasks are added, modified, or deleted
  const tasks = useQuery(api.tasks.getTasks, { projectId });

  if (!tasks) return <div>Loading...</div>;

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
          {/* UI updates automatically when task status changes */}
        </div>
      ))}
    </div>
  );
}
```

### How Real-Time Sync Works

1. **Automatic Subscriptions**: When you call `useQuery`, Convex automatically subscribes to database changes
2. **Server-Side Filtering**: Only relevant changes are sent to clients
3. **Optimistic Updates**: UI updates immediately, then syncs with server
4. **Conflict Resolution**: Convex handles concurrent updates automatically

## Role-Based Access Control

### Permission System

The system uses a hierarchical permission model:

```typescript
const ROLE_PERMISSIONS = {
  admin: [
    "manage_tenant",
    "manage_users",
    "manage_all_projects",
    "manage_all_tasks",
  ],
  project_manager: [
    "create_projects",
    "manage_assigned_projects",
    "assign_tasks",
  ],
  team_lead: ["manage_team_tasks", "review_tasks", "comment_on_tasks"],
  member: ["view_assigned_tasks", "update_task_status", "comment_on_tasks"],
  client: ["view_assigned_projects", "comment_on_tasks"],
};
```

### Middleware Protection

All Convex functions use middleware for access control:

```typescript
// In convex/tasks.ts
export const getTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const { user, project } = await requireProjectAccess(ctx, args.projectId);
    // Function logic here
  },
});
```

### Client-Side Permission Checks

```tsx
export function AdminPanel() {
  const { hasPermission } = useAuth();

  if (!hasPermission("admin")) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

## Authentication Integration

### Convex Auth Setup

The auth system integrates with Convex's built-in authentication:

```tsx
// In lib/auth/auth-context.tsx
export function AuthProvider({ children }) {
  const userData = useQuery(api.auth.me);

  // Authentication state management
}
```

### Login/Logout Flow

```tsx
const { login, logout, isAuthenticated } = useAuth();

// Login redirects to Convex auth provider
// Logout handled by Convex
```

## API Usage Examples

### Queries

```tsx
// Fetch data
const tasks = useQuery(api.tasks.getTasks, { projectId });
const task = useQuery(api.tasks.getTask, { taskId });
const user = useQuery(api.auth.me);
```

### Mutations

```tsx
// Modify data
const createTask = useMutation(api.tasks.createTask);
const updateTask = useMutation(api.tasks.updateTask);
const deleteTask = useMutation(api.tasks.deleteTask);

// Usage
await createTask({
  projectId,
  title: "New Task",
  priority: "high",
});
```

### Optimistic Updates

Mutations automatically provide optimistic updates - the UI updates immediately while the server request is in progress.

## Best Practices

### 1. Type Safety

Always use the generated types from Convex:

```tsx
import type { Id } from "./convex/_generated/dataModel";
```

### 2. Error Handling

Handle errors in mutations:

```tsx
try {
  await updateTask({ taskId, status: "done" });
} catch (error) {
  console.error("Failed to update task:", error);
}
```

### 3. Loading States

Check for loading states:

```tsx
const data = useQuery(api.tasks.getTasks, { projectId });
if (!data) return <div>Loading...</div>;
```

### 4. Real-Time Performance

- Use specific queries rather than fetching all data
- Implement pagination for large datasets
- Use indexes for frequently queried fields

## Deployment

### Development

```bash
npm run convex:dev
```

### Production

```bash
npm run convex:deploy
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Check user permissions and middleware
2. **Type errors**: Ensure you're using the correct Id types
3. **Real-time not working**: Verify ConvexProvider is properly set up
4. **Auth issues**: Check Convex auth configuration

### Debug Mode

Enable debug logging:

```tsx
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  verbose: true,
});
```

## Conclusion

This integration provides a robust, type-safe, and real-time backend for the task management system with comprehensive access control and automatic data synchronization.
