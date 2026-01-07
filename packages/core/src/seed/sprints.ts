import type { Sprint } from "../types";

export const getSeedSprints = (projectId: string): Sprint[] => [
  {
    id: "s-1",
    name: "Sprint 1",
    projectId,
    status: "active",
  },
  {
    id: "s-backlog",
    name: "バックログ",
    projectId,
    status: "future",
  },
];
