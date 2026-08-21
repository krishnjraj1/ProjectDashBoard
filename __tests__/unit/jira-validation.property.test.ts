// Feature: jira-connection, Property 5: Missing or invalid parameter validation
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidProjectKey } from "@/lib/jira/validation";

/**
 * Property 5: Missing or invalid parameter validation
 *
 * For any arbitrary string (including empty, lowercase, special chars, too-long, and valid keys),
 * `isValidProjectKey` returns true only for strings matching /^[A-Z][A-Z0-9_]{1,9}$/.
 *
 * Validates: Requirements 3.8
 */
describe("Property 5: Missing or invalid parameter validation", () => {
  const PROJECT_KEY_REGEX = /^[A-Z][A-Z0-9_]{1,9}$/;

  // Generator for valid project keys: starts with A-Z, followed by 1-9 chars from [A-Z0-9_]
  const validProjectKey = fc
    .tuple(
      fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
      fc.array(
        fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_".split("")),
        { minLength: 1, maxLength: 9 }
      )
    )
    .map(([first, rest]) => first + rest.join(""));

  // Generator for lowercase strings
  const lowercaseString = fc
    .array(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
      { minLength: 1, maxLength: 10 }
    )
    .map((chars) => chars.join(""));

  // Generator for strings with special characters
  const specialCharString = fc
    .array(
      fc.constantFrom(..."!@#$%^&*()-+=[]{}|;:',.<>?/~`".split("")),
      { minLength: 1, maxLength: 10 }
    )
    .map((chars) => chars.join(""));

  // Generator for strings that are too long (>10 chars, all valid chars otherwise)
  const tooLongKey = fc
    .tuple(
      fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
      fc.array(
        fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_".split("")),
        { minLength: 10, maxLength: 30 }
      )
    )
    .map(([first, rest]) => first + rest.join(""));

  // Generator for single-character strings (too short)
  const singleChar = fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));

  // Generator for arbitrary strings (fully random)
  const arbitraryString = fc.oneof(
    fc.constant(""),
    fc.string({ minLength: 0, maxLength: 20 }),
    lowercaseString,
    specialCharString,
    validProjectKey,
    tooLongKey,
    singleChar
  );

  it("returns true for all valid project keys matching /^[A-Z][A-Z0-9_]{1,9}$/", () => {
    fc.assert(
      fc.property(validProjectKey, (key) => {
        expect(isValidProjectKey(key)).toBe(true);
        expect(PROJECT_KEY_REGEX.test(key)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for empty strings", () => {
    fc.assert(
      fc.property(fc.constant(""), (key) => {
        expect(isValidProjectKey(key)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for lowercase strings", () => {
    fc.assert(
      fc.property(lowercaseString, (key) => {
        expect(isValidProjectKey(key)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for strings with special characters", () => {
    fc.assert(
      fc.property(specialCharString, (key) => {
        expect(isValidProjectKey(key)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for keys longer than 10 characters", () => {
    fc.assert(
      fc.property(tooLongKey, (key) => {
        expect(key.length).toBeGreaterThan(10);
        expect(isValidProjectKey(key)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for single-character keys (too short)", () => {
    fc.assert(
      fc.property(singleChar, (key) => {
        expect(key.length).toBe(1);
        expect(isValidProjectKey(key)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("bi-conditional: isValidProjectKey(s) === true iff s matches /^[A-Z][A-Z0-9_]{1,9}$/", () => {
    fc.assert(
      fc.property(arbitraryString, (key) => {
        const expected = PROJECT_KEY_REGEX.test(key);
        const actual = isValidProjectKey(key);
        expect(actual).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
