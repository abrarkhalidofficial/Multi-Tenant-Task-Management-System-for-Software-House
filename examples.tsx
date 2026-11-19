/**
 * Examples of using Convex hooks in React components
 * This file demonstrates how to use useQuery, useMutation, and useAuth
 */

import { useQuery, useMutation } from "./react";
import { api } from "./api";
import { useAuth } from "@/lib/auth/auth-context";
import type { Id } from "./convex/_generated/dataModel";

// Example 1: Using useQuery to fetch tasks for a project
export function TaskList({ projectId }: { projectId: Id<"projects"> }) {
  const tasks = useQuery(api.tasks.getTasks, { projectId });

  if (!tasks) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div>
      <h2>Tasks</h2>
      {tasks.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <span>Status: {task.status}</span>
          <span>Priority: {task.priority}</span>
          {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
        </div>
      ))}
    </div>
  );
}

// Example 2: Using useMutation to create a new task
export function CreateTaskForm({ projectId }: { projectId: Id<"projects"> }) {
  const createTask = useMutation(api.tasks.createTask);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as
      | "low"
      | "medium"
      | "high"
      | "urgent";

    try {
      const result = await createTask({
        projectId,
        title,
        description: description || undefined,
        priority,
      });

      console.log("Task created:", result);
      // Handle success (e.g., show notification, redirect, etc.)
    } catch (error) {
      console.error("Failed to create task:", error);
      // Handle error (e.g., show error message)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Task title" required />
      <textarea name="description" placeholder="Task description" />
      <select name="priority" required>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <button type="submit">Create Task</button>
    </form>
  );
}

// Example 3: Using useMutation to update a task
export function TaskItem({ taskId }: { taskId: Id<"tasks"> }) {
  const task = useQuery(api.tasks.getTask, { taskId });
  const updateTask = useMutation(api.tasks.updateTask);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTask({
        taskId,
        status: newStatus as "todo" | "in_progress" | "review" | "done",
      });
      console.log("Task status updated");
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (!task) {
    return <div>Loading task...</div>;
  }

  return (
    <div>
      <h3>{task.title}</h3>
      <select
        value={task.status}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="review">Review</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}

// Example 4: Using useAuth for authentication state
export function UserProfile() {
  const { user, tenant, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <p>Tenant: {tenant?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Example 5: Using useQuery with real-time updates
export function ProjectDashboard({ projectId }: { projectId: Id<"projects"> }) {
  const tasks = useQuery(api.tasks.getTasks, { projectId });
  // Note: This assumes there's a getProject query - adjust based on your actual API
  // const project = useQuery(api.projects.getProject, { projectId });

  // These queries will automatically update when data changes in Convex
  // No need to manually refresh or poll

  if (!tasks) {
    return <div>Loading...</div>;
  }

  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div>
      <h1>Project Dashboard</h1>
      <div className="dashboard">
        <div className="column">
          <h3>To Do ({todoTasks.length})</h3>
          {todoTasks.map((task) => (
            <div key={task.id} className="task-card">
              {task.title}
            </div>
          ))}
        </div>
        <div className="column">
          <h3>In Progress ({inProgressTasks.length})</h3>
          {inProgressTasks.map((task) => (
            <div key={task.id} className="task-card">
              {task.title}
            </div>
          ))}
        </div>
        <div className="column">
          <h3>Done ({doneTasks.length})</h3>
          {doneTasks.map((task) => (
            <div key={task.id} className="task-card">
              {task.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Example 6: Using useMutation with optimistic updates
export function TaskActions({ taskId }: { taskId: Id<"tasks"> }) {
  const deleteTask = useMutation(api.tasks.deleteTask);
  const updateTask = useMutation(api.tasks.updateTask);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask({ taskId });
        console.log("Task deleted");
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleComplete = async () => {
    try {
      await updateTask({
        taskId,
        status: "done",
      });
      console.log("Task marked as complete");
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  return (
    <div>
      <button onClick={handleComplete}>Mark Complete</button>
      <button onClick={handleDelete}>Delete Task</button>
    </div>
  );
}

// Example 7: Using role-based access control
export function AdminPanel() {
  const { user, hasPermission } = useAuth();

  if (!hasPermission("admin")) {
    return <div>Access denied. Admin permissions required.</div>;
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      {/* Admin-only content */}
    </div>
  );
}

// Example 8: Using useQuery with pagination
export function PaginatedTaskList({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const tasks = useQuery(api.tasks.getTasks, { projectId });

  // For pagination, you would typically use usePaginatedQuery
  // Here's how you would set it up:

  /*
  const {
    results: paginatedTasks,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.tasks.getTasksPaginated,
    { projectId },
    { initialNumItems: 10 }
  );

  return (
    <div>
      {paginatedTasks?.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
      {status === 'CanLoadMore' && (
        <button onClick={() => loadMore(10)}>Load More</button>
      )}
    </div>
  );
  */

  return (
    <div>
      <h2>All Tasks</h2>
      {tasks?.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
