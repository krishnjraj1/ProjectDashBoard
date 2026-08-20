/**
 * JIRA configuration validation module.
 *
 * Reads JIRA credentials from environment variables and validates them.
 * This module is framework-independent and can be reused by both
 * Next.js API route handlers and future MCP Server tool implementations.
 */

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface ConfigError {
  error: string;
}

/**
 * Validates JIRA configuration from environment variables.
 *
 * Checks that:
 * - JIRA_BASE_URL is present and starts with "https://"
 * - JIRA_EMAIL is present and non-empty
 * - JIRA_API_TOKEN is present and non-empty
 *
 * @returns A valid JiraConfig object, or a ConfigError naming the first invalid variable.
 */
export function validateConfig(): JiraConfig | ConfigError {
  const baseUrl = process.env.JIRA_BASE_URL ?? "";
  const email = process.env.JIRA_EMAIL ?? "";
  const apiToken = process.env.JIRA_API_TOKEN ?? "";

  if (!baseUrl || !baseUrl.startsWith("https://")) {
    return {
      error: "Server configuration error: JIRA_BASE_URL is missing or empty",
    };
  }

  if (!email) {
    return {
      error: "Server configuration error: JIRA_EMAIL is missing or empty",
    };
  }

  if (!apiToken) {
    return {
      error: "Server configuration error: JIRA_API_TOKEN is missing or empty",
    };
  }

  return { baseUrl, email, apiToken };
}
