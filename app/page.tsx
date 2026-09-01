"use client";

import { useState } from "react";
import StatusBadge from "@/app/components/StatusBadge";
import ProjectsSection from "@/app/components/ProjectsSection";
import BoardsSection from "@/app/components/BoardsSection";
import IssuesSection from "@/app/components/IssuesSection";

export default function Home() {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | undefined>(undefined);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">JIRA Connection</h1>
        <StatusBadge />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <ProjectsSection
            onProjectSelect={(key: string) => setSelectedProjectKey(key)}
            selectedProjectKey={selectedProjectKey}
          />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <BoardsSection />
        </section>
      </div>

      <section className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Issues</h2>
        <IssuesSection selectedProjectKey={selectedProjectKey} />
      </section>
    </main>
  );
}
