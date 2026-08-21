// Feature: jira-connection, Property 2: Auth header construction
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createAuthHeader } from "@/lib/jira/client";

/**
 * Property 2: Auth header construction
 *
 * For any non-empty email string and non-empty API token string, the `createAuthHeader`
 * function SHALL produce a string equal to `"Basic " + base64(email + ":" + token)`,
 * and decoding the base64 portion SHALL yield the original email and token separated by a colon.
 *
 * Validates: Requirements 3.4
 */
describe("Property 2: Auth header construction", () => {
  // Generator for arbitrary non-empty strings (email)
  const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.length > 0);

  // Generator for non-empty strings that may contain special characters
  const arbitraryEmail = fc.oneof(
    nonEmptyString,
    fc.emailAddress(),
    fc.string({ minLength: 1, maxLength: 50 }).map((s) => `${s}@example.com`)
  );

  // Generator for non-empty API token strings
  const arbitraryToken = fc.oneof(
    nonEmptyString,
    fc.base64String({ minLength: 1, maxLength: 64 }),
    fc.string({ minLength: 1, maxLength: 64 })
  );

  it("produces a string equal to 'Basic ' + base64(email + ':' + token)", () => {
    fc.assert(
      fc.property(arbitraryEmail, arbitraryToken, (email, token) => {
        const result = createAuthHeader(email, token);

        // Compute expected value
        const credentials = `${email}:${token}`;
        const expectedBase64 = Buffer.from(credentials).toString("base64");
        const expected = `Basic ${expectedBase64}`;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("always starts with 'Basic ' prefix", () => {
    fc.assert(
      fc.property(arbitraryEmail, arbitraryToken, (email, token) => {
        const result = createAuthHeader(email, token);

        expect(result.startsWith("Basic ")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("decoding the base64 portion yields original email:token", () => {
    fc.assert(
      fc.property(arbitraryEmail, arbitraryToken, (email, token) => {
        const result = createAuthHeader(email, token);

        // Extract the base64 portion (everything after "Basic ")
        const base64Part = result.slice("Basic ".length);

        // Decode and verify it yields email:token
        const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

        expect(decoded).toBe(`${email}:${token}`);
      }),
      { numRuns: 100 }
    );
  });

  it("decoded value contains exactly one colon separating email and token", () => {
    fc.assert(
      fc.property(
        // Use strings without colons to verify the single colon comes from the separator
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0 && !s.includes(":")),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0 && !s.includes(":")),
        (email, token) => {
          const result = createAuthHeader(email, token);
          const base64Part = result.slice("Basic ".length);
          const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

          // Split on colon - should yield exactly [email, token]
          const parts = decoded.split(":");
          expect(parts.length).toBe(2);
          expect(parts[0]).toBe(email);
          expect(parts[1]).toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });
});
