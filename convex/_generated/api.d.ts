/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_builtInTemplates from "../lib/builtInTemplates.js";
import type * as lib_diggCore from "../lib/diggCore.js";
import type * as lib_diggCoreV2 from "../lib/diggCoreV2.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_templateValidation from "../lib/templateValidation.js";
import type * as messages from "../messages.js";
import type * as migrations_cleanOldFields from "../migrations/cleanOldFields.js";
import type * as projects from "../projects.js";
import type * as rateLimits from "../rateLimits.js";
import type * as repairs from "../repairs.js";
import type * as seed from "../seed.js";
import type * as surveys from "../surveys.js";
import type * as templates from "../templates.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  "lib/authorization": typeof lib_authorization;
  "lib/builtInTemplates": typeof lib_builtInTemplates;
  "lib/diggCore": typeof lib_diggCore;
  "lib/diggCoreV2": typeof lib_diggCoreV2;
  "lib/email": typeof lib_email;
  "lib/templateValidation": typeof lib_templateValidation;
  messages: typeof messages;
  "migrations/cleanOldFields": typeof migrations_cleanOldFields;
  projects: typeof projects;
  rateLimits: typeof rateLimits;
  repairs: typeof repairs;
  seed: typeof seed;
  surveys: typeof surveys;
  templates: typeof templates;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
