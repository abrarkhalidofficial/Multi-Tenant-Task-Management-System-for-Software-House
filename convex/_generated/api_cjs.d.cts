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
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as files from "../files.js";
import type * as middleware from "../middleware.js";
import type * as projects from "../projects.js";
import type * as tasks from "../tasks.js";
import type * as tenants from "../tenants.js";
import type * as utils_permissions from "../utils/permissions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  comments: typeof comments;
  files: typeof files;
  middleware: typeof middleware;
  projects: typeof projects;
  tasks: typeof tasks;
  tenants: typeof tenants;
  "utils/permissions": typeof utils_permissions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
