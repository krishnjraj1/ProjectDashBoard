import { NextResponse } from "next/server";
import { jiraFetch } from "@/lib/jira/client";
import { JiraApiBoardResponse, transformBoards } from "@/lib/jira/types";

export async function GET() {
  const result = await jiraFetch<JiraApiBoardResponse>(
    "/rest/agile/1.0/board"
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    );
  }

  return NextResponse.json(transformBoards(result.data!));
}
