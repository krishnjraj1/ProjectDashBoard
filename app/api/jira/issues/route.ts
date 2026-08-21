import { NextRequest, NextResponse } from "next/server";
import { jiraFetch } from "@/lib/jira/client";
import { JiraApiSearchResponse, transformIssues } from "@/lib/jira/types";
import { isValidProjectKey } from "@/lib/jira/validation";

export async function GET(request: NextRequest) {
  const projectKey = request.nextUrl.searchParams.get("projectKey");

  if (!projectKey) {
    return NextResponse.json(
      { error: "Missing required parameter: projectKey" },
      { status: 400 }
    );
  }

  if (!isValidProjectKey(projectKey)) {
    return NextResponse.json(
      { error: "Invalid projectKey: must match /^[A-Z][A-Z0-9_]{1,9}$/" },
      { status: 400 }
    );
  }

  const result = await jiraFetch<JiraApiSearchResponse>(
    `/rest/api/3/search?jql=project=${projectKey}&maxResults=50`
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    );
  }

  return NextResponse.json(transformIssues(result.data!));
}
