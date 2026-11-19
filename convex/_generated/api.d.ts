/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activityLogs from "../activityLogs.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as login from "../login.js";
import type * as notifications from "../notifications.js";
import type * as projects from "../projects.js";
import type * as setup from "../setup.js";
import type * as tasks from "../tasks.js";
import type * as tenants from "../tenants.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  analytics: typeof analytics;
  auth: typeof auth;
  comments: typeof comments;
  login: typeof login;
  notifications: typeof notifications;
  projects: typeof projects;
  setup: typeof setup;
  tasks: typeof tasks;
  tenants: typeof tenants;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
