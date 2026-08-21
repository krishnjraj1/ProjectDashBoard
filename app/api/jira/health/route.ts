import { NextResponse } from "next/server";
import { jiraFetch } from "@/lib/jira/client";
import { validateConfig } from "@/lib/jira/config";
import type { HealthStatus } from "@/lib/jira/types";

/**
 * GET /api/jira/health
 *
 * Lightweight health-check endpoint that verifies JIRA connectivity
 * by calling GET /rest/api/3/myself. Returns connected/disconnected status.
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  // Validate config first — if credentials are missing, report disconnected
  const config = validateConfig();
  if ("error" in config) {
    return NextResponse.json(
      { status: "disconnected", error: config.error } as HealthStatus,
      { status: 503 }
    );
  }

  // Attempt a lightweight JIRA API call to verify connectivity
  const result = await jiraFetch<unknown>("/rest/api/3/myself");

  if (result.error) {
    return NextResponse.json(
      { status: "disconnected", error: result.error.message } as HealthStatus,
      { status: 503 }
    );
  }

  return NextResponse.json(
    { status: "connected", baseUrl: config.baseUrl } as HealthStatus,
    { status: 200 }
  );
}
