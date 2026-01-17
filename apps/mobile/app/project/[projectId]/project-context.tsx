import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Issue, Project, ProjectStats, Sprint, Version } from "@repo/core";
import { buildProjectStats } from "@repo/core";
import { getIssues, getProjectById, getSprints, getUsers, getVersions } from "@repo/storage";

import { useStorageReady } from "@/hooks/use-storage";

type ProjectDataContextValue = {
  ready: boolean;
  projectId: string;
  project: Project | null;
  issues: Issue[];
  sprints: Sprint[];
  versions: Version[];
  stats: ProjectStats | null;
  reload: () => Promise<void>;
};

const ProjectDataContext = createContext<ProjectDataContextValue | null>(null);

type ProjectDataProviderProps = {
  projectId: string;
  children: ReactNode;
};

export function ProjectDataProvider({
  projectId,
  children,
}: ProjectDataProviderProps) {
  const ready = useStorageReady();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const [projectData, issueData, sprintData, versionData, userData] = await Promise.all([
      getProjectById(projectId),
      getIssues(projectId),
      getSprints(projectId),
      getVersions(projectId),
      getUsers(),
    ]);
    setProject(projectData);
    setIssues(issueData);
    setSprints(sprintData);
    setVersions(versionData);
    setStats(buildProjectStats(issueData, userData));
  }, [projectId]);

  useEffect(() => {
    if (!ready || !projectId) return;
    void reload();
  }, [ready, projectId, reload]);

  const value = useMemo(
    () => ({
      ready,
      projectId,
      project,
      issues,
      sprints,
      versions,
      stats,
      reload,
    }),
    [ready, projectId, project, issues, sprints, versions, stats, reload],
  );

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error("useProjectData must be used within ProjectDataProvider");
  }
  return context;
}
