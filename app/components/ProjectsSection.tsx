"use client";

import { useState, useEffect } from "react";
import { JiraProject } from "@/lib/jira/types";

interface ProjectsSectionProps {
  onProjectSelect: (projectKey: string) => void;
  selectedProjectKey?: string;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "data"; projects: JiraProject[] };

export default function ProjectsSection({
  onProjectSelect,
  selectedProjectKey,
}: ProjectsSectionProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        const res = await fetch("/api/jira/projects");
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Request failed" }));
          if (!cancelled) {
            setState({ status: "error", message: body.error || `Request failed with status ${res.status}` });
          }
          return;
        }

        const projects: JiraProject[] = await res.json();
        if (!cancelled) {
          if (projects.length === 0) {
            setState({ status: "empty" });
          } else {
            setState({ status: "data", projects });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "An unexpected error occurred",
          });
        }
      }
    }

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="space-y-3" data-testid="projects-loading">
        <div className="h-4 w-3/4 animate-pulse bg-gray-200 rounded" />
        <div className="h-4 w-1/2 animate-pulse bg-gray-200 rounded" />
        <div className="h-4 w-2/3 animate-pulse bg-gray-200 rounded" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="border border-red-300 bg-red-50 text-red-700 p-4 rounded"
        data-testid="projects-error"
      >
        {state.message}
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="text-gray-500 p-4" data-testid="projects-empty">
        No projects found
      </div>
    );
  }

  return (
    <div data-testid="projects-list">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 px-3 text-sm font-medium text-gray-600">Key</th>
            <th className="py-2 px-3 text-sm font-medium text-gray-600">Name</th>
          </tr>
        </thead>
        <tbody>
          {state.projects.map((project) => (
            <tr
              key={project.key}
              onClick={() => onProjectSelect(project.key)}
              className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                selectedProjectKey === project.key ? "bg-blue-50" : ""
              }`}
              data-testid={`project-row-${project.key}`}
            >
              <td className="py-2 px-3 text-sm font-mono">{project.key}</td>
              <td className="py-2 px-3 text-sm">{project.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
