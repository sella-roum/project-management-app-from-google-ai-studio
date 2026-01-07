import * as SQLite from "expo-sqlite";

import type {
  Issue,
  Notification,
  Project,
  Sprint,
} from "@repo/core";
import {
  DEFAULT_NOTIFICATION_SCHEME,
  getSeedIssues,
  getSeedNotifications,
  getSeedProjects,
  getSeedSprints,
  WORKFLOW_TRANSITIONS,
} from "@repo/core";
import type {
  AppStorage,
  ID,
  IssuesRepo,
  NotificationsRepo,
  ProjectsRepo,
  SettingsStore,
  SprintsRepo,
  Unsubscribe,
} from "../contracts";
import { AsyncStorageSettingsStore } from "./settingsStore";

type SQLiteRow = {
  id: string;
  data: string;
  projectId?: string;
  read?: number;
};

const noopUnsubscribe: Unsubscribe = () => undefined;

export class SQLiteStorageAdapter implements AppStorage {
  private dbPromise: Promise<SQLite.SQLiteDatabase>;
  private ready: Promise<void>;
  settings: SettingsStore;
  projects: ProjectsRepo;
  issues: IssuesRepo;
  sprints: SprintsRepo;
  notifications: NotificationsRepo;

  constructor({
    dbName = "app-storage.db",
    settings = new AsyncStorageSettingsStore(),
  }: {
    dbName?: string;
    settings?: SettingsStore;
  } = {}) {
    this.dbPromise = SQLite.openDatabaseAsync(dbName);
    this.settings = settings;
    this.ready = this.initialize();

    this.projects = {
      list: () => this.listProjects(),
      get: (id) => this.getProjectById(id),
      create: (input) => this.createProject(input),
      update: (id, patch) => this.updateProject(id, patch),
      toggleStar: (id) => this.toggleProjectStar(id),
      remove: (id) => this.removeProject(id),
      watchAll: (listener) => this.watchProjects(listener),
      watchById: (id, listener) => this.watchProject(id, listener),
    };

    this.issues = {
      listByProject: (projectId) => this.listIssues(projectId),
      create: (input) => this.createIssue(input),
      update: (id, patch) => this.updateIssue(id, patch),
      updateStatus: (id, status) => this.updateIssue(id, { status }),
      remove: (id) => this.removeIssue(id),
      watchAll: (listener) => this.watchIssues(listener),
      watchById: (id, listener) => this.watchIssue(id, listener),
    };

    this.sprints = {
      listByProject: (projectId) => this.listSprints(projectId),
      create: (input) => this.createSprint(input),
      start: (id) => this.updateSprint(id, { status: "active" }),
      complete: (id) => this.updateSprint(id, { status: "completed" }),
      watchAll: (listener) => this.watchSprints(listener),
      watchById: (id, listener) => this.watchSprint(id, listener),
    };

    this.notifications = {
      markRead: (id) => this.markNotificationRead(id),
      markAllRead: () => this.markAllNotificationsRead(),
      watchAll: (listener) => this.watchNotifications(listener),
      watchById: (id, listener) => this.watchNotification(id, listener),
    };
  }

  private async initialize(): Promise<void> {
    const db = await this.dbPromise;
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS issues_project_id ON issues (projectId);
      CREATE TABLE IF NOT EXISTS sprints (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sprints_project_id ON sprints (projectId);
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL
      );
    `);
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    await this.ready;
    return this.dbPromise;
  }

  private parseRow<T>(row?: SQLiteRow | null): T | null {
    if (!row) return null;
    return JSON.parse(row.data) as T;
  }

  private async queryAll<T>(
    sql: string,
    params: SQLite.SQLiteBindValue[] = [],
  ): Promise<T[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SQLiteRow>(sql, params);
    return rows.map((row) => JSON.parse(row.data) as T);
  }

  private async queryFirst<T>(
    sql: string,
    params: SQLite.SQLiteBindValue[] = [],
  ): Promise<T | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<SQLiteRow>(sql, params);
    return this.parseRow<T>(row);
  }

  private async watchAll<T>(
    list: () => Promise<T[]>,
    listener: (rows: T[]) => void,
  ): Promise<Unsubscribe> {
    const rows = await list();
    listener(rows);
    return noopUnsubscribe;
  }

  private async watchById<T>(
    fetch: () => Promise<T | null>,
    listener: (row: T | null) => void,
  ): Promise<Unsubscribe> {
    const row = await fetch();
    listener(row);
    return noopUnsubscribe;
  }

  private listProjects = async (): Promise<Project[]> =>
    this.queryAll<Project>("SELECT data FROM projects");

  private getProjectById = async (id: ID): Promise<Project | null> =>
    this.queryFirst<Project>("SELECT data FROM projects WHERE id = ?", [id]);

  private createProject = async (
    input: Omit<Project, "id"> & { id?: ID },
  ): Promise<Project> => {
    const id = input.id ?? `p-${Date.now()}`;
    const project: Project = {
      id,
      leadId: "u1",
      category: "Software",
      type: "Kanban",
      starred: false,
      workflowSettings: WORKFLOW_TRANSITIONS,
      notificationSettings: DEFAULT_NOTIFICATION_SCHEME,
      ...input,
    };
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)",
      [id, JSON.stringify(project)],
    );
    return project;
  };

  private updateProject = async (
    id: ID,
    patch: Partial<Project>,
  ): Promise<Project> => {
    const existing = await this.getProjectById(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    const db = await this.getDb();
    await db.runAsync("UPDATE projects SET data = ? WHERE id = ?", [
      JSON.stringify(updated),
      id,
    ]);
    return updated;
  };

  private toggleProjectStar = async (id: ID): Promise<void> => {
    const project = await this.getProjectById(id);
    if (!project) return;
    await this.updateProject(id, { starred: !project.starred });
  };

  private removeProject = async (id: ID): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM projects WHERE id = ?", [id]);
    await db.runAsync("DELETE FROM issues WHERE projectId = ?", [id]);
    await db.runAsync("DELETE FROM sprints WHERE projectId = ?", [id]);
  };

  private watchProjects = (listener: (rows: Project[]) => void) =>
    this.watchAll(() => this.listProjects(), listener);

  private watchProject = (id: ID, listener: (row: Project | null) => void) =>
    this.watchById(() => this.getProjectById(id), listener);

  private listIssues = async (projectId: ID): Promise<Issue[]> =>
    this.queryAll<Issue>("SELECT data FROM issues WHERE projectId = ?", [
      projectId,
    ]);

  private getIssueById = async (id: ID): Promise<Issue | null> =>
    this.queryFirst<Issue>("SELECT data FROM issues WHERE id = ?", [id]);

  private createIssue = async (
    input: Partial<Issue> & { projectId: ID; title: string },
  ): Promise<Issue> => {
    const project = await this.getProjectById(input.projectId);
    const db = await this.getDb();
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM issues WHERE projectId = ?",
      [input.projectId],
    );
    const count = countRow?.count ?? 0;
    const nowIso = new Date().toISOString();
    const issue: Issue = {
      id: input.id ?? `i-${Date.now()}`,
      key: `${project?.key ?? "PRJ"}-${count + 1}`,
      projectId: input.projectId,
      title: input.title,
      type: input.type ?? "Task",
      status: input.status ?? "To Do",
      priority: input.priority ?? "Medium",
      assigneeId: input.assigneeId,
      reporterId: input.reporterId ?? "u1",
      sprintId: input.sprintId,
      labels: input.labels ?? [],
      comments: input.comments ?? [],
      workLogs: input.workLogs ?? [],
      history: input.history ?? [],
      links: input.links ?? [],
      attachments: input.attachments ?? [],
      watcherIds: input.watcherIds ?? [],
      createdAt: input.createdAt ?? nowIso,
      updatedAt: input.updatedAt ?? nowIso,
    };
    await db.runAsync(
      "INSERT OR REPLACE INTO issues (id, projectId, data) VALUES (?, ?, ?)",
      [issue.id, issue.projectId, JSON.stringify(issue)],
    );
    return issue;
  };

  private updateIssue = async (
    id: ID,
    patch: Partial<Issue>,
  ): Promise<Issue> => {
    const existing = await this.getIssueById(id);
    if (!existing) {
      throw new Error(`Issue not found: ${id}`);
    }
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE issues SET data = ?, projectId = ? WHERE id = ?",
      [JSON.stringify(updated), updated.projectId, id],
    );
    return updated;
  };

  private removeIssue = async (id: ID): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM issues WHERE id = ?", [id]);
  };

  private watchIssues = (listener: (rows: Issue[]) => void) =>
    this.watchAll(() => this.queryAll<Issue>("SELECT data FROM issues"), listener);

  private watchIssue = (id: ID, listener: (row: Issue | null) => void) =>
    this.watchById(() => this.getIssueById(id), listener);

  private listSprints = async (projectId: ID): Promise<Sprint[]> =>
    this.queryAll<Sprint>("SELECT data FROM sprints WHERE projectId = ?", [
      projectId,
    ]);

  private getSprintById = async (id: ID): Promise<Sprint | null> =>
    this.queryFirst<Sprint>("SELECT data FROM sprints WHERE id = ?", [id]);

  private createSprint = async (
    input: Partial<Sprint> & { projectId: ID; name: string },
  ): Promise<Sprint> => {
    const sprint: Sprint = {
      id: input.id ?? `s-${Date.now()}`,
      projectId: input.projectId,
      name: input.name,
      status: input.status ?? "planning",
      startDate: input.startDate,
      endDate: input.endDate,
      goal: input.goal,
    };
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO sprints (id, projectId, data) VALUES (?, ?, ?)",
      [sprint.id, sprint.projectId, JSON.stringify(sprint)],
    );
    return sprint;
  };

  private updateSprint = async (
    id: ID,
    patch: Partial<Sprint>,
  ): Promise<Sprint> => {
    const existing = await this.getSprintById(id);
    if (!existing) {
      throw new Error(`Sprint not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE sprints SET data = ?, projectId = ? WHERE id = ?",
      [JSON.stringify(updated), updated.projectId, id],
    );
    return updated;
  };

  private watchSprints = (listener: (rows: Sprint[]) => void) =>
    this.watchAll(
      () => this.queryAll<Sprint>("SELECT data FROM sprints"),
      listener,
    );

  private watchSprint = (id: ID, listener: (row: Sprint | null) => void) =>
    this.watchById(() => this.getSprintById(id), listener);

  private listNotifications = async (): Promise<Notification[]> =>
    this.queryAll<Notification>("SELECT data FROM notifications");

  private getNotificationById = async (id: ID): Promise<Notification | null> =>
    this.queryFirst<Notification>(
      "SELECT data FROM notifications WHERE id = ?",
      [id],
    );

  private markNotificationRead = async (id: ID): Promise<void> => {
    const notification = await this.getNotificationById(id);
    if (!notification) return;
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE notifications SET data = ?, read = 1 WHERE id = ?",
      [JSON.stringify({ ...notification, read: true }), id],
    );
  };

  private markAllNotificationsRead = async (): Promise<void> => {
    const notifications = await this.listNotifications();
    const db = await this.getDb();
    await db.execAsync("UPDATE notifications SET read = 1");
    await Promise.all(
      notifications.map((notification) =>
        db.runAsync("UPDATE notifications SET data = ? WHERE id = ?", [
          JSON.stringify({ ...notification, read: true }),
          notification.id,
        ]),
      ),
    );
  };

  private watchNotifications = (listener: (rows: Notification[]) => void) =>
    this.watchAll(() => this.listNotifications(), listener);

  private watchNotification = (
    id: ID,
    listener: (row: Notification | null) => void,
  ) => this.watchById(() => this.getNotificationById(id), listener);

  seedDemo = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
    `);

    const seedProjects = getSeedProjects();
    const [seedProject] = seedProjects;
    if (!seedProject) return;
    await this.createProject(seedProject);

    const seedSprints = getSeedSprints(seedProject.id);
    for (const sprint of seedSprints) {
      await this.createSprint(sprint);
    }

    const nowIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
    const issues = getSeedIssues({
      projectId: seedProject.id,
      sprintId: seedSprints[0]?.id || "s-1",
      backlogSprintId: seedSprints[1]?.id || "s-backlog",
      nowIso,
      yesterdayIso,
    });
    for (const issue of issues) {
      await this.createIssue(issue);
    }

    const notifications = getSeedNotifications(nowIso);
    for (const notification of notifications) {
      await db.runAsync(
        "INSERT OR REPLACE INTO notifications (id, read, data) VALUES (?, ?, ?)",
        [
          notification.id,
          notification.read ? 1 : 0,
          JSON.stringify(notification),
        ],
      );
    }
  };

  reset = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
    `);

    const keysToRemove = [
      "isLoggedIn",
      "currentUserId",
      "hasSetup",
      "appInitialized",
      "notificationsEnabled",
    ];
    const dashboardKeys = await this.settings.keys("dashboard_gadgets_");
    await this.settings.multiRemove([...keysToRemove, ...dashboardKeys]);
  };
}
