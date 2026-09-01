/**
 * JIRA error sanitization module.
 *
 * Maps raw JIRA HTTP error responses to sanitized, client-safe messages.
 * Raw JIRA error details are logged server-side only and never forwarded
 * to the client.
 */

export interface SanitizedError {
  status: number;
  message: string;
}

/** Predefined client-safe error messages by JIRA status code. */
const ERROR_MESSAGES: Record<number, string> = {
  401: "JIRA authentication failed",
  403: "JIRA access denied",
  404: "JIRA resource not found",
  429: "JIRA rate limit exceeded",
};

/**
 * Sanitizes a JIRA HTTP error into a client-safe error object.
 *
 * Mapping:
 * - 401 → 401, "JIRA authentication failed"
 * - 403 → 403, "JIRA access denied"
 * - 404 → 404, "JIRA resource not found"
 * - 429 → 429, "JIRA rate limit exceeded"
 * - 5xx (500–599) → 502, "JIRA service unavailable"
 * - Other 4xx → original status, "JIRA request failed"
 *
 * The raw JIRA error message is logged server-side at `warn` level
 * but never included in the returned object.
 *
 * @param jiraStatus - The HTTP status code returned by the JIRA API
 * @param rawMessage - The raw error message/body from the JIRA response
 * @returns A SanitizedError with mapped status and predefined message
 */
export function sanitizeJiraError(
  jiraStatus: number,
  rawMessage: string
): SanitizedError {
  // Log raw error details server-side for debugging
  console.warn("JIRA API error details:", { status: jiraStatus, rawMessage });

  // Check for a known 4xx mapping
  const knownMessage = ERROR_MESSAGES[jiraStatus];
  if (knownMessage) {
    return { status: jiraStatus, message: knownMessage };
  }

  // Map 5xx to 502
  if (jiraStatus >= 500 && jiraStatus <= 599) {
    return { status: 502, message: "JIRA service unavailable" };
  }

  // Other 4xx codes — pass through the status, use generic message
  return { status: jiraStatus, message: "JIRA request failed" };
}
