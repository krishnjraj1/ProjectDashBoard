/**
 * JIRA client module.
 *
 * Provides authentication header construction and a typed fetch wrapper
 * for making requests to the JIRA REST API. This module is framework-independent
 * and can be reused by both Next.js API route handlers and MCP Server tool implementations.
 */

import { validateConfig } from "./config";

export interface JiraRequestResult<T> {
  data?: T;
  error?: { status: number; message: string };
}

/**
 * Creates a Basic Auth header value from email and API token.
 *
 * @param email - Atlassian account email
 * @param apiToken - Atlassian API token
 * @returns Authorization header value: "Basic " + base64(email + ":" + token)
 */
export function createAuthHeader(email: string, apiToken: string): string {
  const credentials = `${email}:${apiToken}`;
  const encoded = Buffer.from(credentials).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Sanitizes a JIRA HTTP error status to a client-safe error message.
 * This is a minimal inline mapping; a more complete implementation
 * lives in errors.ts (task 2.5).
 */
function sanitizeErrorMessage(status: number): string {
  if (status === 401) return "JIRA authentication failed";
  if (status === 403) return "JIRA access denied";
  if (status === 404) return "JIRA resource not found";
  if (status === 429) return "JIRA rate limit exceeded";
  if (status >= 500) return "JIRA service unavailable";
  return "JIRA request failed";
}

/**
 * Maps a JIRA HTTP error status to the appropriate client-facing status code.
 */
function mapErrorStatus(jiraStatus: number): number {
  if (jiraStatus === 401) return 401;
  if (jiraStatus === 403) return 403;
  if (jiraStatus === 404) return 404;
  if (jiraStatus === 429) return 429;
  if (jiraStatus >= 500) return 502;
  return jiraStatus;
}

/**
 * Makes an authenticated request to the JIRA REST API.
 *
 * - Validates config before making any request
 * - Constructs the full URL from config.baseUrl + path
 * - Sets Authorization and Accept headers
 * - Uses AbortController with a 10-second timeout
 * - Returns typed result or sanitized error
 *
 * @param path - API path (e.g., "/rest/api/3/project")
 * @param options - Optional RequestInit overrides (method, body, etc.)
 * @returns A JiraRequestResult containing either data or a sanitized error
 */
export async function jiraFetch<T>(
  path: string,
  options?: RequestInit
): Promise<JiraRequestResult<T>> {
  // Validate config first — fail fast if credentials are missing
  const config = validateConfig();
  if ("error" in config) {
    return { error: { status: 500, message: config.error } };
  }

  const url = `${config.baseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: createAuthHeader(config.email, config.apiToken),
        Accept: "application/json",
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Log raw error details server-side for debugging
      let rawBody = "";
      try {
        rawBody = await response.text();
      } catch {
        // Ignore body read failures
      }
      console.warn(
        `JIRA API error: ${response.status} ${response.statusText}`,
        { url, rawBody }
      );

      return {
        error: {
          status: mapErrorStatus(response.status),
          message: sanitizeErrorMessage(response.status),
        },
      };
    }

    const data = (await response.json()) as T;
    return { data };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Handle timeout (AbortError)
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("JIRA API request timed out", { url });
      return {
        error: {
          status: 502,
          message: "Unable to connect to JIRA: request timed out",
        },
      };
    }

    // Handle network errors
    const errorMessage =
      err instanceof Error ? err.message : "unknown error";
    console.warn("JIRA API network error", { url, error: errorMessage });
    return {
      error: {
        status: 502,
        message: `Unable to connect to JIRA: ${errorMessage}`,
      },
    };
  }
}
