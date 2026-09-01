import { NextResponse } from "next/server";
import { jiraFetch } from "@/lib/jira/client";
import { JiraApiProject, transformProjects } from "@/lib/jira/types";

export async function GET() {
  const result = await jiraFetch<JiraApiProject[]>("/rest/api/3/project");

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    );
  }

  return NextResponse.json(transformProjects(result.data!));
}
