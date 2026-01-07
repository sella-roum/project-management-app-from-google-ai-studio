import type { Issue, User } from "../types";

export interface ProjectStats {
  workload: { userName: string; count: number }[];
  epicProgress: { id: string; title: string; percent: number }[];
}

export const buildProjectStats = (
  issues: Issue[],
  users: User[],
): ProjectStats => {
  const workload = users.map((u) => ({
    userName: u.name,
    count: issues.filter((i) => i.assigneeId === u.id).length,
  }));

  const epics = issues.filter((i) => i.type === "Epic");
  const epicProgress = epics.map((epic) => {
    const children = issues.filter((i) => i.parentId === epic.id);
    const doneCount = children.filter((i) => i.status === "Done").length;
    const percent =
      children.length > 0 ? Math.round((doneCount / children.length) * 100) : 0;
    return { id: epic.id, title: epic.title, percent };
  });

  return { workload, epicProgress };
};
