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
import type * as auth_inviteUser from "../auth/inviteUser.js";
import type * as comments_mutations from "../comments/mutations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as reports_queries from "../reports/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/inviteUser": typeof auth_inviteUser;
  "comments/mutations": typeof comments_mutations;
  "lib/auth": typeof lib_auth;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "projects/mutations": typeof projects_mutations;
  "reports/queries": typeof reports_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
