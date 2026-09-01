"use client";

import { useState, useEffect } from "react";
import type { JiraBoard } from "@/lib/jira/types";

type BoardsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "data"; boards: JiraBoard[] };

function getTypeBadgeClasses(type: string): string {
  switch (type.toLowerCase()) {
    case "scrum":
      return "bg-blue-100 text-blue-800";
    case "kanban":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function BoardsSection() {
  const [state, setState] = useState<BoardsState>({ status: "loading" });

  useEffect(() => {
    async function fetchBoards() {
      try {
        const response = await fetch("/api/jira/boards");
        if (!response.ok) {
          const body = await response.json();
          setState({ status: "error", message: body.error || "Failed to fetch boards" });
          return;
        }
        const boards: JiraBoard[] = await response.json();
        if (boards.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "data", boards });
        }
      } catch {
        setState({ status: "error", message: "Failed to fetch boards" });
      }
    }

    fetchBoards();
  }, []);

  if (state.status === "loading") {
    return (
      <section aria-label="Boards">
        <h2 className="text-xl font-semibold mb-4">Boards</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded h-8 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-label="Boards">
        <h2 className="text-xl font-semibold mb-4">Boards</h2>
        <div className="border border-red-300 bg-red-50 text-red-700 p-4 rounded">
          {state.message}
        </div>
      </section>
    );
  }

  if (state.status === "empty") {
    return (
      <section aria-label="Boards">
        <h2 className="text-xl font-semibold mb-4">Boards</h2>
        <div className="text-gray-500 p-4 bg-gray-50 rounded">No boards found</div>
      </section>
    );
  }

  return (
    <section aria-label="Boards">
      <h2 className="text-xl font-semibold mb-4">Boards</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 px-3 font-medium text-gray-700">Name</th>
            <th className="py-2 px-3 font-medium text-gray-700">Type</th>
          </tr>
        </thead>
        <tbody>
          {state.boards.map((board) => (
            <tr key={board.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3">{board.name}</td>
              <td className="py-2 px-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getTypeBadgeClasses(board.type)}`}
                >
                  {board.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
