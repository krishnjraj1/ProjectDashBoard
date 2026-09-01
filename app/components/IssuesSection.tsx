"use client";

import { useState, useEffect } from "react";
import type { JiraIssue } from "@/lib/jira/types";

interface IssuesSectionProps {
  selectedProjectKey?: string;
}

function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "done") return "bg-green-100 text-green-800";
  if (lower === "in progress") return "bg-blue-100 text-blue-800";
  if (lower === "to do") return "bg-gray-100 text-gray-800";
  return "bg-purple-100 text-purple-800";
}

export default function IssuesSection({ selectedProjectKey }: IssuesSectionProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!selectedProjectKey) {
      setIssues([]);
      setError(null);
      setFetched(false);
      return;
    }

    async function fetchIssues() {
      setLoading(true);
      setError(null);
      setFetched(false);

      try {
        const res = await fetch(`/api/jira/issues?projectKey=${selectedProjectKey}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || `Request failed with status ${res.status}`);
        }
        const data: JiraIssue[] = await res.json();
        setIssues(data);
        setFetched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setFetched(true);
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, [selectedProjectKey]);

  // No project selected — show prompt
  if (!selectedProjectKey) {
    return (
      <div className="border border-gray-200 rounded p-6 text-center text-gray-500">
        Select a project to view issues
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading issues">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="animate-pulse bg-gray-200 rounded h-5 w-20" />
            <div className="animate-pulse bg-gray-200 rounded h-5 flex-1" />
            <div className="animate-pulse bg-gray-200 rounded h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  // Empty state
  if (fetched && issues.length === 0) {
    return (
      <div className="border border-gray-200 rounded p-6 text-center text-gray-500">
        No issues found for this project
      </div>
    );
  }

  // Data state — render issues table
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">Summary</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {issues.map((issue) => (
            <tr key={issue.key} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {issue.key}
              </td>
              <td className="px-4 py-3 text-gray-700">{issue.summary}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(issue.status)}`}
                >
                  {issue.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
