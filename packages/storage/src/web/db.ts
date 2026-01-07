import Dexie, { Table } from "dexie";
import type {
  AutomationLog,
  AutomationRule,
  Issue,
  Notification,
  Project,
  SavedFilter,
  Sprint,
  User,
  Version,
  ViewHistory,
} from "@repo/core";

export class JiraCloneDB extends Dexie {
  users!: Table<User>;
  projects!: Table<Project>;
  issues!: Table<Issue>;
  sprints!: Table<Sprint>;
  projectVersions!: Table<Version>;
  notifications!: Table<Notification>;
  automationRules!: Table<AutomationRule>;
  automationLogs!: Table<AutomationLog>;
  savedFilters!: Table<SavedFilter>;
  viewHistory!: Table<ViewHistory>;

  constructor() {
    super("JiraCloneDB");
    this.version(9).stores({
      users: "id, &email",
      projects: "id, key, type, leadId",
      issues:
        "id, key, projectId, sprintId, assigneeId, reporterId, parentId, status, type",
      sprints: "id, projectId, status",
      projectVersions: "id, projectId",
      notifications: "id, read, createdAt",
      automationRules: "id, projectId, trigger, enabled",
      automationLogs: "id, ruleId, executedAt",
      savedFilters: "id",
      viewHistory: "id, userId, viewedAt, [userId+issueId]",
    });
  }
}
