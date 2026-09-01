/**
 * JIRA parameter validation module.
 *
 * Validates user-supplied parameters (e.g., project keys) before they are used
 * in JIRA API requests. This prevents JQL injection and ensures only well-formed
 * values reach the JIRA REST API.
 */

/**
 * Validates a JIRA project key against the expected format.
 *
 * JIRA project keys must:
 * - Start with an uppercase letter (A-Z)
 * - Contain only uppercase letters, digits, and underscores
 * - Be 2–10 characters in length
 *
 * @param key - The project key string to validate
 * @returns true if the key matches /^[A-Z][A-Z0-9_]{1,9}$/, false otherwise
 */
export function isValidProjectKey(key: string): boolean {
  return /^[A-Z][A-Z0-9_]{1,9}$/.test(key);
}
