import { describe, it, expect } from "vitest";
import { isValidProjectKey } from "@/lib/jira/validation";

describe("isValidProjectKey", () => {
  describe("valid keys", () => {
    it("accepts a two-character uppercase key (AB)", () => {
      expect(isValidProjectKey("AB")).toBe(true);
    });

    it("accepts a typical project key (PROJ)", () => {
      expect(isValidProjectKey("PROJ")).toBe(true);
    });

    it("accepts a key with underscores and digits (MY_PROJ12)", () => {
      expect(isValidProjectKey("MY_PROJ12")).toBe(true);
    });

    it("accepts a 10-character key (maximum length)", () => {
      expect(isValidProjectKey("ABCDEFGHIJ")).toBe(true);
    });

    it("accepts a key with trailing digits (TEST99)", () => {
      expect(isValidProjectKey("TEST99")).toBe(true);
    });

    it("accepts a key with underscore after first char (A_B)", () => {
      expect(isValidProjectKey("A_B")).toBe(true);
    });
  });

  describe("invalid keys", () => {
    it("rejects an empty string", () => {
      expect(isValidProjectKey("")).toBe(false);
    });

    it("rejects a lowercase key (proj)", () => {
      expect(isValidProjectKey("proj")).toBe(false);
    });

    it("rejects a mixed-case key (Proj)", () => {
      expect(isValidProjectKey("Proj")).toBe(false);
    });

    it("rejects a key with special characters (PR@J)", () => {
      expect(isValidProjectKey("PR@J")).toBe(false);
    });

    it("rejects a single character key (A)", () => {
      expect(isValidProjectKey("A")).toBe(false);
    });

    it("rejects a key longer than 10 characters", () => {
      expect(isValidProjectKey("ABCDEFGHIJK")).toBe(false);
    });

    it("rejects a key starting with a digit (1PROJ)", () => {
      expect(isValidProjectKey("1PROJ")).toBe(false);
    });

    it("rejects a key starting with an underscore (_PROJ)", () => {
      expect(isValidProjectKey("_PROJ")).toBe(false);
    });

    it("rejects a key with spaces (MY PROJ)", () => {
      expect(isValidProjectKey("MY PROJ")).toBe(false);
    });

    it("rejects a key with hyphens (MY-PROJ)", () => {
      expect(isValidProjectKey("MY-PROJ")).toBe(false);
    });

    it("rejects a key with dots (MY.PROJ)", () => {
      expect(isValidProjectKey("MY.PROJ")).toBe(false);
    });
  });
});
