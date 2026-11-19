import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  userRoles,
  taskStatuses,
  taskPriorities,
  projectStatuses,
  messageStatuses,
  notificationTypes,
} from "./schema";

// Type exports for use throughout the application
export type UserRole = (typeof userRoles)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type MessageStatus = (typeof messageStatuses)[number];
export type NotificationType = (typeof notificationTypes)[number];

// Utility types
export type User = Doc<"users">;
export type Tenant = Doc<"tenants">;
export type Project = Doc<"projects">;
export type Task = Doc<"tasks">;
export type Comment = Doc<"comments">;
export type Document = Doc<"documents">;
export type Conversation = Doc<"conversations">;
export type Message = Doc<"messages">;
export type Notification = Doc<"notifications">;
export type Team = Doc<"teams">;

/**
 * Check if a user has the required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: UserRole[] = [
    "client",
    "member",
    "team_lead",
    "project_manager",
    "admin",
  ];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if a user has permission for a specific action
 */
export function hasPermission(
  userRole: UserRole,
  resource: "project" | "task" | "user" | "team" | "document",
  action: "create" | "read" | "update" | "delete",
  isOwner: boolean = false,
  isAssignee: boolean = false
): boolean {
  // Admin can do everything
  if (userRole === "admin") return true;

  // Owner can always read/update their own resources
  if (isOwner && ["read", "update"].includes(action)) return true;

  // Assignee can update assigned tasks
  if (isAssignee && resource === "task" && action === "update") return true;

  switch (resource) {
    case "project":
      if (action === "read") return true; // Everyone can read projects
      if (action === "create")
        return ["project_manager", "admin"].includes(userRole);
      if (action === "update")
        return ["project_manager", "team_lead", "admin"].includes(userRole);
      if (action === "delete") return ["admin"].includes(userRole);
      break;

    case "task":
      if (action === "read") return true;
      if (action === "create")
        return ["project_manager", "team_lead", "admin"].includes(userRole);
      if (action === "update")
        return ["project_manager", "team_lead", "member", "admin"].includes(
          userRole
        );
      if (action === "delete")
        return ["project_manager", "admin"].includes(userRole);
      break;

    case "user":
      if (action === "read") return true;
      if (action === "create") return userRole === ("admin" as UserRole);
      if (action === "update")
        return isOwner || userRole === ("admin" as UserRole);
      if (action === "delete") return userRole === ("admin" as UserRole);
      break;

    case "team":
      if (action === "read") return true;
      if (action === "create") return userRole === ("admin" as UserRole);
      if (action === "update") return userRole === ("admin" as UserRole);
      if (action === "delete") return userRole === ("admin" as UserRole);
      break;

    case "document":
      if (action === "read") return true;
      if (action === "create") return true;
      if (action === "update")
        return isOwner || ["project_manager", "admin"].includes(userRole);
      if (action === "delete") return isOwner || ["admin"].includes(userRole);
      break;
  }

  return false;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: number): string {
  const now = Date.now();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "Yesterday" : `${days} days ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

/**
 * Generate a unique slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if user is currently working based on their working hours
 */
export function isUserWorking(workingHours: {
  start: string;
  end: string;
  timezone: string;
}): boolean {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= workingHours.start && currentTime <= workingHours.end;
}

/**
 * Get task status color based on status
 */
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "review":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "done":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

/**
 * Get priority color based on priority
 */
export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "medium":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Extract mentions from content (@username)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Calculate project progress based on task completion
 */
export function calculateProjectProgress(
  tasks: Array<{ status: TaskStatus }>
): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  return Math.round((completedTasks / tasks.length) * 100);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: number): boolean {
  return Date.now() > dueDate;
}

/**
 * Get the next task status in the workflow
 */
export function getNextTaskStatus(
  currentStatus: TaskStatus
): TaskStatus | null {
  const workflow: TaskStatus[] = ["todo", "in_progress", "review", "done"];
  const currentIndex = workflow.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }

  return workflow[currentIndex + 1];
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: {
    name: string;
    size: number;
    type: string;
  },
  maxSize: number = 10 * 1024 * 1024
): { valid: boolean; error?: string } {
  // Check file size (default 10MB max)
  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds maximum allowed size" };
  }

  // Check file type
  const allowedTypes = [
    "pdf",
    "docx",
    "xlsx",
    "pptx",
    "txt",
    "jpg",
    "png",
    "mp4",
    "zip",
    "figma",
  ];
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
}
