"use client";

import { useState, useEffect } from "react";
import type { HealthStatus } from "@/lib/jira/types";

type ConnectionState = "checking" | "connected" | "disconnected";

export default function StatusBadge() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch("/api/jira/health", { signal: controller.signal })
      .then((res) => {
        if (res.ok) {
          return res.json().then((data: HealthStatus) => {
            setState("connected");
            setBaseUrl(data.baseUrl ?? "");
          });
        } else {
          setState("disconnected");
        }
      })
      .catch(() => {
        setState("disconnected");
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const badgeClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border";

  const stateStyles: Record<ConnectionState, string> = {
    checking: "bg-gray-100 text-gray-600 border-gray-200",
    connected: "bg-green-100 text-green-800 border-green-200",
    disconnected: "bg-red-100 text-red-800 border-red-200",
  };

  const stateLabels: Record<ConnectionState, string> = {
    checking: "Checking...",
    connected: "Connected",
    disconnected: "Disconnected",
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`${badgeClasses} ${stateStyles[state]}`}>
        {stateLabels[state]}
      </span>
      {state === "connected" && baseUrl && (
        <span className="text-sm text-gray-500">{baseUrl}</span>
      )}
    </div>
  );
}
