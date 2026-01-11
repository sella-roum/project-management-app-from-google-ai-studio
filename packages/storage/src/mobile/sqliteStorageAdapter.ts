import * as SQLite from "expo-sqlite";

import type {
  Attachment,
  AutomationLog,
  AutomationRule,
  Issue,
  IssueStatus,
  LinkType,
  Notification,
  Project,
  SavedFilter,
  Sprint,
  User,
  Version,
  ViewHistory,
  WorkLog,
} from "@repo/core";
import {
  buildProjectStats,
  DEFAULT_NOTIFICATION_SCHEME,
  evaluateAutomationCondition,
  getSeedIssues,
  getSeedNotifications,
  getSeedProjects,
  getSeedSprints,
  getSeedUsers,
  selectRecentIssues,
  sortAutomationLogsByExecutedAt,
  STATUS_LABELS,
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
  email?: string;
  read?: number;
  userId?: string;
  issueId?: string;
  viewedAt?: string;
  ownerId?: string;
  ruleId?: string;
  status?: string;
  enabled?: number;
  executedAt?: string;
};

type NativeFile = {
  uri: string;
  name?: string;
  type?: string;
  mimeType?: string;
  size?: number;
};

type WebFile = File;

type CrossPlatformFile = WebFile | NativeFile;

type UpdateIssueResult =
  | { success: true; issue: Issue }
  | { success: false; error: "not_found" | "invalid_transition"; message: string };

const SEED_USERS: User[] = getSeedUsers();
const DEFAULT_POLL_INTERVAL_MS = 1000;
const normalizeSavedFilter = (filter: SavedFilter): SavedFilter => ({
  ...filter,
  isJqlMode: filter.isJqlMode ?? false,
});

export class SQLiteStorageAdapter implements AppStorage {
  private dbPromise: Promise<SQLite.SQLiteDatabase>;
  private ready: Promise<void>;
  private currentUserId = "u1";
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
      list: () => this.listProjectsInternal(),
      get: (id) => this.getProjectByIdInternal(id),
      create: (input) => this.createProjectInternal(input),
      update: (id, patch) => this.updateProjectInternal(id, patch),
      toggleStar: (id) => this.toggleProjectStarInternal(id),
      remove: (id) => this.removeProjectInternal(id),
      watchAll: (listener) => this.watchProjects(listener),
      watchById: (id, listener) => this.watchProject(id, listener),
    };

    this.issues = {
      listByProject: (projectId) => this.listIssuesInternal(projectId),
      create: (input) => this.createIssueInternal(input),
      update: (id, patch) => this.updateIssue(id, patch),
      updateStatus: (id, status) => this.updateIssueStatus(id, status),
      remove: (id) => this.removeIssueInternal(id),
      watchAll: (listener) => this.watchIssues(listener),
      watchById: (id, listener) => this.watchIssue(id, listener),
    };

    this.sprints = {
      listByProject: (projectId) => this.listSprintsInternal(projectId),
      create: (input) => this.createSprintInternal(input),
      start: (id) => this.updateSprintInternal(id, { status: "active" }),
      complete: (id) => this.updateSprintInternal(id, { status: "completed" }),
      watchAll: (listener) => this.watchSprints(listener),
      watchById: (id, listener) => this.watchSprint(id, listener),
    };

    this.notifications = {
      markRead: (id) => this.markNotificationReadInternal(id),
      markAllRead: () => this.markAllNotificationsReadInternal(),
      watchAll: (listener) => this.watchNotifications(listener),
      watchById: (id, listener) => this.watchNotification(id, listener),
    };
  }

  private async initialize(): Promise<void> {
    const db = await this.dbPromise;
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS users_email ON users (email);
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
        userId TEXT,
        read INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS notifications_user ON notifications (userId);
      CREATE TABLE IF NOT EXISTS view_history (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        issueId TEXT NOT NULL,
        viewedAt TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS view_history_user ON view_history (userId);
      CREATE INDEX IF NOT EXISTS view_history_issue ON view_history (issueId);
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS versions_project ON versions (projectId);
      CREATE TABLE IF NOT EXISTS saved_filters (
        id TEXT PRIMARY KEY NOT NULL,
        ownerId TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS saved_filters_owner ON saved_filters (ownerId);
      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS automation_rules_project ON automation_rules (projectId);
      CREATE TABLE IF NOT EXISTS automation_logs (
        id TEXT PRIMARY KEY NOT NULL,
        ruleId TEXT NOT NULL,
        status TEXT NOT NULL,
        executedAt TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS automation_logs_rule ON automation_logs (ruleId);
    `);
    const storedUserId = await this.settings.get("currentUserId");
    if (storedUserId) {
      this.currentUserId = storedUserId;
    } else {
      await this.settings.set("currentUserId", this.currentUserId);
    }
    await this.ensureNotificationUserIdColumn(db);
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    await this.ready;
    return this.dbPromise;
  }

  private parseRow<T>(row?: SQLiteRow | null): T | null {
    if (!row) return null;
    return JSON.parse(row.data) as T;
  }

  private async upsertUser(user: User): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO users (id, email, data) VALUES (?, ?, ?)",
      [user.id, user.email ?? null, JSON.stringify(user)],
    );
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<SQLiteRow>(
      "SELECT data FROM users WHERE email = ?",
      [email],
    );
    return this.parseRow<User>(row);
  }

  private async setCurrentUserId(id: string): Promise<void> {
    this.currentUserId = id;
    await this.settings.set("currentUserId", id);
  }

  private async ensureNotificationUserIdColumn(
    db: SQLite.SQLiteDatabase,
  ): Promise<void> {
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(notifications)",
    );
    const hasUserId = columns.some((column) => column.name === "userId");
    if (!hasUserId) {
      await db.execAsync("ALTER TABLE notifications ADD COLUMN userId TEXT");
    }
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS notifications_user ON notifications (userId)",
    );
    if (this.currentUserId) {
      await db.runAsync(
        "UPDATE notifications SET userId = ? WHERE userId IS NULL",
        [this.currentUserId],
      );
    }
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

  private serializeWatchValue(value: unknown) {
    return JSON.stringify(value);
  }

  private async startPolling<T>(
    fetch: () => Promise<T>,
    listener: (value: T) => void,
    intervalMs = DEFAULT_POLL_INTERVAL_MS,
  ): Promise<Unsubscribe> {
    let active = true;
    let lastSerialized = "";

    const runOnce = async () => {
      try {
        const value = await fetch();
        const serialized = this.serializeWatchValue(value);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          listener(value);
        }
      } catch (error) {
        console.error("Storage polling error:", error);
      }
    };

    await runOnce();

    const intervalId = setInterval(() => {
      if (!active) return;
      void runOnce();
    }, intervalMs);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }

  private watchAll<T>(
    list: () => Promise<T[]>,
    listener: (rows: T[]) => void,
  ): Promise<Unsubscribe> {
    return this.startPolling(list, listener);
  }

  private watchById<T>(
    fetch: () => Promise<T | null>,
    listener: (row: T | null) => void,
  ): Promise<Unsubscribe> {
    return this.startPolling(fetch, listener);
  }

  private listProjectsInternal = async (): Promise<Project[]> =>
    this.queryAll<Project>("SELECT data FROM projects");

  private getProjectByIdInternal = async (id: ID): Promise<Project | null> =>
    this.queryFirst<Project>("SELECT data FROM projects WHERE id = ?", [id]);

  private createProjectInternal = async (
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

  private updateProjectInternal = async (
    id: ID,
    patch: Partial<Project>,
  ): Promise<Project> => {
    const existing = await this.getProjectByIdInternal(id);
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

  private toggleProjectStarInternal = async (id: ID): Promise<void> => {
    const project = await this.getProjectByIdInternal(id);
    if (!project) return;
    await this.updateProjectInternal(id, { starred: !project.starred });
  };

  private removeProjectInternal = async (id: ID): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM projects WHERE id = ?", [id]);
    await db.runAsync("DELETE FROM issues WHERE projectId = ?", [id]);
    await db.runAsync("DELETE FROM sprints WHERE projectId = ?", [id]);
  };

  private watchProjects = (listener: (rows: Project[]) => void) =>
    this.watchAll(() => this.listProjectsInternal(), listener);

  private watchProject = (id: ID, listener: (row: Project | null) => void) =>
    this.watchById(() => this.getProjectByIdInternal(id), listener);

  private listIssuesInternal = async (projectId: ID): Promise<Issue[]> =>
    this.queryAll<Issue>("SELECT data FROM issues WHERE projectId = ?", [
      projectId,
    ]);

  private getIssueByIdInternal = async (id: ID): Promise<Issue | null> =>
    this.queryFirst<Issue>("SELECT data FROM issues WHERE id = ?", [id]);

  private createIssueInternal = async (
    input: Partial<Issue> & { projectId: ID; title: string },
  ): Promise<Issue> => {
    const project = await this.getProjectByIdInternal(input.projectId);
    const db = await this.getDb();
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM issues WHERE projectId = ?",
      [input.projectId],
    );
    const count = countRow?.count ?? 0;
    const nowIso = new Date().toISOString();
    const currentUserId = this.getCurrentUserId();
    const issue: Issue = {
      id: input.id ?? `i-${Date.now()}`,
      key: `${project?.key ?? "PRJ"}-${count + 101}`,
      projectId: input.projectId,
      title: input.title || "無題",
      type: input.type ?? "Task",
      status: input.status ?? "To Do",
      priority: input.priority ?? "Medium",
      assigneeId: input.assigneeId,
      reporterId: input.reporterId ?? currentUserId,
      sprintId: input.sprintId,
      fixVersionId: input.fixVersionId,
      dueDate: input.dueDate,
      storyPoints: input.storyPoints,
      labels: input.labels ?? [],
      comments: input.comments ?? [],
      workLogs: input.workLogs ?? [],
      history: input.history ?? [
        {
          id: `h-${Date.now()}`,
          authorId: currentUserId,
          field: "status",
          from: null,
          to: input.status ?? "To Do",
          createdAt: nowIso,
        },
      ],
      links: input.links ?? [],
      attachments: input.attachments ?? [],
      parentId: input.parentId,
      watcherIds: input.watcherIds ?? [currentUserId],
      createdAt: input.createdAt ?? nowIso,
      updatedAt: input.updatedAt ?? nowIso,
    };
    await db.runAsync(
      "INSERT OR REPLACE INTO issues (id, projectId, data) VALUES (?, ?, ?)",
      [issue.id, issue.projectId, JSON.stringify(issue)],
    );
    await this.dispatchProjectNotification(
      issue.projectId,
      "issue_created",
      issue,
    );
    if (issue.assigneeId && issue.assigneeId !== currentUserId) {
      await this.dispatchProjectNotification(
        issue.projectId,
        "issue_assigned",
        issue,
      );
    }
    await this.runAutomation("issue_created", issue);
    return issue;
  };

  private updateIssueInternal = async (
    id: ID,
    patch: Partial<Issue>,
  ): Promise<UpdateIssueResult> => {
    const existing = await this.getIssueByIdInternal(id);
    if (!existing) {
      return {
        success: false,
        error: "not_found",
        message: `Issue not found: ${id}`,
      };
    }

    if (patch.status && patch.status !== existing.status) {
      const project = await this.getProjectByIdInternal(existing.projectId);
      const workflow = project?.workflowSettings || WORKFLOW_TRANSITIONS;
      const allowed = workflow[existing.status] || [];
      if (!allowed.includes(patch.status)) {
        return {
          success: false,
          error: "invalid_transition",
          message: `Invalid transition from ${existing.status} to ${patch.status}`,
        };
      }
    }

    const currentUserId = this.getCurrentUserId();
    let historyIndex = 0;
    const historyEntries: Array<{
      id: string;
      authorId: string;
      field: string;
      from: unknown;
      to: unknown;
      createdAt: string;
    }> = [];
    const nowIso = new Date().toISOString();

    for (const [key, value] of Object.entries(patch)) {
      if ((existing as any)[key] !== value) {
        historyIndex += 1;
        historyEntries.push({
          id: `h-${Date.now()}-${historyIndex}-${key}`,
          authorId: currentUserId,
          field: key,
          from: (existing as any)[key],
          to: value,
          createdAt: nowIso,
        });
      }
    }

    const updated: Issue = {
      ...existing,
      ...patch,
      updatedAt: nowIso,
      history: [...(existing.history || []), ...historyEntries],
    };

    const db = await this.getDb();
    await db.runAsync(
      "UPDATE issues SET data = ?, projectId = ? WHERE id = ?",
      [JSON.stringify(updated), updated.projectId, id],
    );

    for (const [key, value] of Object.entries(patch)) {
      if ((existing as any)[key] === value) continue;
      if (key === "assigneeId" && value && value !== currentUserId) {
        await this.dispatchProjectNotification(
          updated.projectId,
          "issue_assigned",
          updated,
        );
      }
      if (key === "status") {
        const event = value === "Done" ? "issue_resolved" : "status_changed";
        await this.dispatchProjectNotification(
          updated.projectId,
          event,
          updated,
        );
      }
    }

    if (patch.status && patch.status !== existing.status) {
      await this.runAutomation("status_changed", updated);
    }

    return { success: true, issue: updated };
  };

  private removeIssueInternal = async (id: ID): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM issues WHERE id = ?", [id]);
  };

  private watchIssues = (listener: (rows: Issue[]) => void) =>
    this.watchAll(() => this.queryAll<Issue>("SELECT data FROM issues"), listener);

  private watchIssue = (id: ID, listener: (row: Issue | null) => void) =>
    this.watchById(() => this.getIssueByIdInternal(id), listener);

  private listSprintsInternal = async (projectId: ID): Promise<Sprint[]> =>
    this.queryAll<Sprint>("SELECT data FROM sprints WHERE projectId = ?", [
      projectId,
    ]);

  private getSprintByIdInternal = async (id: ID): Promise<Sprint | null> =>
    this.queryFirst<Sprint>("SELECT data FROM sprints WHERE id = ?", [id]);

  private createSprintInternal = async (
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

  private updateSprintInternal = async (
    id: ID,
    patch: Partial<Sprint>,
  ): Promise<Sprint> => {
    const existing = await this.getSprintByIdInternal(id);
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
    this.watchById(() => this.getSprintByIdInternal(id), listener);

  private listNotificationsInternal = async (): Promise<Notification[]> =>
    this.queryAll<Notification>("SELECT data FROM notifications");

  private getNotificationByIdInternal = async (
    id: ID,
  ): Promise<Notification | null> =>
    this.queryFirst<Notification>(
      "SELECT data FROM notifications WHERE id = ?",
      [id],
    );

  private markNotificationReadInternal = async (id: ID): Promise<void> => {
    const notification = await this.getNotificationByIdInternal(id);
    if (!notification) return;
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE notifications SET data = ?, read = 1 WHERE id = ?",
      [JSON.stringify({ ...notification, read: true }), id],
    );
  };

  private markAllNotificationsReadInternal = async (): Promise<void> => {
    const notifications = await this.listNotificationsInternal();
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
    this.watchAll(() => this.listNotificationsInternal(), listener);

  private watchNotification = (
    id: ID,
    listener: (row: Notification | null) => void,
  ) => this.watchById(() => this.getNotificationByIdInternal(id), listener);

  private async updateIssueRow(issue: Issue): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE issues SET data = ?, projectId = ? WHERE id = ?",
      [JSON.stringify(issue), issue.projectId, issue.id],
    );
  }

  private async createNotificationInternal(
    notification: Partial<Notification> & { issueId?: string; userId: string },
  ): Promise<void> {
    const db = await this.getDb();
    const createdAt = new Date().toISOString();
    const data: Notification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: notification.title || "システム通知",
      description: notification.description || "",
      read: false,
      createdAt,
      type: notification.type || "system",
      issueId: notification.issueId,
    };
    await db.runAsync(
      "INSERT OR REPLACE INTO notifications (id, userId, read, data) VALUES (?, ?, ?, ?)",
      [data.id, notification.userId, data.read ? 1 : 0, JSON.stringify(data)],
    );
  }

  private async dispatchProjectNotification(
    projectId: string,
    event: string,
    issue: Issue,
  ) {
    const project = await this.getProjectByIdInternal(projectId);
    const scheme = project?.notificationSettings || DEFAULT_NOTIFICATION_SCHEME;
    const recipients = scheme[event] || [];
    const currentUserId = this.getCurrentUserId();

    const targetUserIds = new Set<string>();
    if (recipients.includes("Reporter") && issue.reporterId) {
      targetUserIds.add(issue.reporterId);
    }
    if (recipients.includes("Assignee") && issue.assigneeId) {
      targetUserIds.add(issue.assigneeId);
    }
    if (recipients.includes("Watcher")) {
      (issue.watcherIds || []).forEach((id) => targetUserIds.add(id));
    }

    if (targetUserIds.has(currentUserId)) {
      targetUserIds.delete(currentUserId);
    }

    let title = "通知";
    let description = issue.title;

    if (event === "issue_created") {
      title = `新しい課題が作成されました: ${issue.key}`;
    }
    if (event === "issue_assigned") {
      title = `課題があなたに割り当てられました: ${issue.key}`;
    }
    if (event === "status_changed") {
      title = `課題のステータスが「${STATUS_LABELS[issue.status]}」に変更されました`;
    }
    if (event === "comment_added") {
      title = `新しいコメントが追加されました: ${issue.key}`;
    }
    if (event === "issue_resolved") {
      title = `課題が解決されました: ${issue.key}`;
    }

    for (const _userId of targetUserIds) {
      await this.createNotificationInternal({
        userId: _userId,
        title,
        description,
        type: event === "comment_added" ? "mention" : "system",
        issueId: issue.id,
      });
    }
  }

  getCurrentUserId = (): string => this.currentUserId;

  clearDatabase = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
      DELETE FROM users;
      DELETE FROM view_history;
      DELETE FROM versions;
      DELETE FROM saved_filters;
      DELETE FROM automation_rules;
      DELETE FROM automation_logs;
    `);
  };

  checkIfDatabaseIsSeeded = async (): Promise<boolean> => {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM users",
    );
    return (row?.count ?? 0) > 0;
  };

  loginAsUser = async (email: string): Promise<User | null> => {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    await this.setCurrentUserId(user.id);
    return user;
  };

  registerUser = async (email: string, name: string): Promise<User> => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    };
    await this.upsertUser(newUser);
    await this.setCurrentUserId(newUser.id);
    return newUser;
  };

  getUserById = async (id: string): Promise<User | null> =>
    this.queryFirst<User>("SELECT data FROM users WHERE id = ?", [id]);

  getCurrentUser = async (): Promise<User | null> => {
    const id = this.getCurrentUserId();
    if (!id) return null;
    return this.getUserById(id);
  };

  updateUser = async (
    id: string,
    updates: Partial<User>,
  ): Promise<User | null> => {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await this.upsertUser(updated);
    return updated;
  };

  getUserStats = async (uid: string) => {
    if (!uid) return { assigned: 0, reported: 0, leading: 0 };
    const issues = await this.queryAll<Issue>("SELECT data FROM issues");
    const projects = await this.listProjectsInternal();
    const assignedRow = issues.filter((issue) => issue.assigneeId === uid);
    const reportedRow = issues.filter((issue) => issue.reporterId === uid);
    const leadingRow = projects.filter((project) => project.leadId === uid);
    return {
      assigned: assignedRow.length,
      reported: reportedRow.length,
      leading: leadingRow.length,
    };
  };

  getProjects = async (): Promise<Project[]> => this.listProjectsInternal();

  getProjectById = async (id: string): Promise<Project | null> =>
    this.getProjectByIdInternal(id);

  createProject = async (
    project: Omit<Project, "id"> & { id?: ID },
  ): Promise<Project> => this.createProjectInternal(project);

  updateProject = async (
    id: string,
    updates: Partial<Project>,
  ): Promise<Project> => this.updateProjectInternal(id, updates);

  deleteProject = async (id: string): Promise<void> =>
    this.removeProjectInternal(id);

  hasPermission = (
    userId: string,
    action: string,
    _project?: Project,
  ): boolean => {
    // Expected permission semantics (placeholder until roles are modeled):
    // - "manage_project": project lead/admin only.
    // - "delete_issue": project lead/admin only.
    // - other actions: project members.
    if (userId === "u1") return true;
    if (action === "manage_project") return userId === "u2";
    return true;
  };

  getNotifications = async (): Promise<Notification[]> => {
    const notifications = await this.listNotificationsInternal();
    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  getUnreadMentionCount = async (): Promise<number> => {
    const notifications = await this.listNotificationsInternal();
    return notifications.filter((n) => !n.read).length;
  };

  markNotificationRead = async (id: string): Promise<void> =>
    this.markNotificationReadInternal(id);

  markAllNotificationsRead = async (): Promise<void> =>
    this.markAllNotificationsReadInternal();

  getIssues = async (projectId?: string): Promise<Issue[]> => {
    if (projectId) return this.listIssuesInternal(projectId);
    return this.queryAll<Issue>("SELECT data FROM issues");
  };

  getIssueById = async (id: string): Promise<Issue | null> =>
    this.getIssueByIdInternal(id);

  createIssue = async (
    issue: Partial<Issue> & { projectId: ID; title: string },
  ): Promise<Issue> => this.createIssueInternal(issue);

  updateIssue = async (
    id: string,
    updates: Partial<Issue>,
  ): Promise<Issue | false | undefined> => {
    const result = await this.updateIssueInternal(id, updates);
    if (result.success) return result.issue;
    if (result.error === "invalid_transition") return false;
    return undefined;
  };

  getIssuesForUser = async (userId: string): Promise<Issue[]> => {
    const issues = await this.queryAll<Issue>("SELECT data FROM issues");
    return issues.filter((issue) => issue.assigneeId === userId);
  };

  updateIssueStatus = async (
    id: string,
    status: IssueStatus,
  ): Promise<Issue | false | undefined> => {
    const result = await this.updateIssueInternal(id, { status });
    if (result.success) return result.issue;
    if (result.error === "invalid_transition") return false;
    return undefined;
  };

  deleteIssue = async (id: string): Promise<void> =>
    this.deleteIssueInternal(id);

  private deleteIssueInternal = async (id: ID): Promise<void> => {
    const issue = await this.getIssueByIdInternal(id);
    if (!issue) return;
    const project = await this.getProjectByIdInternal(issue.projectId);
    const currentUserId = this.getCurrentUserId();
    if (!this.hasPermission(currentUserId, "delete_issue", project ?? undefined)) {
      throw new Error("Permission denied: delete_issue");
    }
    await this.removeIssueInternal(id);
  };

  addAttachment = async (
    issueId: string,
    file: CrossPlatformFile,
  ): Promise<void> => {
    const issue = await this.getIssueByIdInternal(issueId);
    if (!issue) return;

    const fileName = file.name ?? "attachment";
    const fileType =
      file.type ??
      ("mimeType" in file ? file.mimeType : undefined) ??
      "application/octet-stream";
    const fileSize = file.size ?? 0;

    const addAttachmentData = async (data: string) => {
      const newAttachment: Attachment = {
        id: `at-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName,
        fileType,
        fileSize,
        data,
        createdAt: new Date().toISOString(),
      };
      const attachments = [...(issue.attachments || []), newAttachment];
      const updated: Issue = {
        ...issue,
        attachments,
        updatedAt: new Date().toISOString(),
      };
      await this.updateIssueRow(updated);
    };

    const isWebFile = (input: CrossPlatformFile): input is WebFile =>
      typeof File !== "undefined" && input instanceof File;
    const isNativeFile = (input: CrossPlatformFile): input is NativeFile =>
      "uri" in input && typeof input.uri === "string";

    if (typeof FileReader === "undefined") {
      if (isNativeFile(file)) {
        await addAttachmentData(file.uri);
      }
      return;
    }

    if (!isWebFile(file)) {
      if (isNativeFile(file)) {
        await addAttachmentData(file.uri);
      }
      return;
    }

    const reader = new FileReader();
    await new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          await addAttachmentData(reader.result as string);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("File upload failed"));
      reader.readAsDataURL(file);
    });
  };

  addComment = async (id: string, text: string) => {
    const issue = await this.getIssueByIdInternal(id);
    if (!issue) return;
    const comments = [
      ...(issue.comments ?? []),
      {
        id: `c-${Date.now()}`,
        authorId: this.getCurrentUserId(),
        content: text,
        createdAt: new Date().toISOString(),
      },
    ];
    const updated: Issue = {
      ...issue,
      comments,
      updatedAt: new Date().toISOString(),
    };
    await this.updateIssueRow(updated);
    await this.dispatchProjectNotification(
      issue.projectId,
      "comment_added",
      issue,
    );
    await this.runAutomation("comment_added", issue);
  };

  addIssueLink = async (issueId: string, targetId: string, type: LinkType) => {
    const issue = await this.getIssueByIdInternal(issueId);
    if (!issue) return;
    const links = [
      ...(issue.links ?? []),
      { id: `l-${Date.now()}`, type, outwardIssueId: targetId },
    ];
    const updated: Issue = {
      ...issue,
      links,
      updatedAt: new Date().toISOString(),
    };
    await this.updateIssueRow(updated);
  };

  getSubtasks = async (parentId: string): Promise<Issue[]> => {
    return this.queryAll<Issue>(
      "SELECT data FROM issues WHERE json_extract(data, '$.parentId') = ?",
      [parentId],
    );
  };

  logWork = async (
    issueId: string,
    seconds: number,
    comment?: string,
  ): Promise<void> => {
    const issue = await this.getIssueByIdInternal(issueId);
    if (!issue) return;
    const newLog: WorkLog = {
      id: `wl-${Date.now()}`,
      authorId: this.getCurrentUserId(),
      timeSpentSeconds: seconds,
      comment,
      createdAt: new Date().toISOString(),
    };
    const workLogs = [...(issue.workLogs ?? []), newLog];
    const updated: Issue = {
      ...issue,
      workLogs,
      updatedAt: new Date().toISOString(),
    };
    await this.updateIssueRow(updated);
  };

  toggleWatch = async (issueId: string): Promise<void> => {
    const issue = await this.getIssueByIdInternal(issueId);
    if (!issue) return;
    const currentUserId = this.getCurrentUserId();
    const watcherIds = [...(issue.watcherIds ?? [])];
    const index = watcherIds.indexOf(currentUserId);
    if (index >= 0) {
      watcherIds.splice(index, 1);
    } else {
      watcherIds.push(currentUserId);
    }
    const updated: Issue = {
      ...issue,
      watcherIds,
      updatedAt: new Date().toISOString(),
    };
    await this.updateIssueRow(updated);
  };

  recordView = async (issueId: string): Promise<void> => {
    const db = await this.getDb();
    const currentUserId = this.getCurrentUserId();
    const history: ViewHistory = {
      id: `${currentUserId}-${issueId}`,
      userId: currentUserId,
      issueId,
      viewedAt: new Date().toISOString(),
    };
    await db.runAsync(
      "INSERT OR REPLACE INTO view_history (id, userId, issueId, viewedAt, data) VALUES (?, ?, ?, ?, ?)",
      [
        history.id,
        history.userId,
        history.issueId,
        history.viewedAt,
        JSON.stringify(history),
      ],
    );
  };

  getRecentIssues = async (): Promise<Issue[]> => {
    const db = await this.getDb();
    const currentUserId = this.getCurrentUserId();
    const rows = await db.getAllAsync<SQLiteRow>(
      "SELECT data FROM view_history WHERE userId = ? ORDER BY viewedAt DESC",
      [currentUserId],
    );
    const history = rows.map((row) => JSON.parse(row.data) as ViewHistory);
    if (history.length === 0) return [];
    const issues = await this.queryAll<Issue>("SELECT data FROM issues");
    return selectRecentIssues(history, issues);
  };

  getSprints = async (projectId: string): Promise<Sprint[]> =>
    this.listSprintsInternal(projectId);

  createSprint = async (projectId: string): Promise<Sprint> =>
    this.createSprintInternal({ projectId, name: `Sprint ${Date.now()}` });

  updateSprintStatus = async (
    id: string,
    status: "active" | "future" | "completed",
  ): Promise<Sprint> => this.updateSprintInternal(id, { status });

  getVersions = async (projectId: string): Promise<Version[]> =>
    this.queryAll<Version>("SELECT data FROM versions WHERE projectId = ?", [
      projectId,
    ]);

  createVersion = async (version: Partial<Version>): Promise<Version> => {
    const newVersion = {
      id: `v-${Date.now()}`,
      status: "unreleased",
      ...version,
    } as Version;
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO versions (id, projectId, data) VALUES (?, ?, ?)",
      [newVersion.id, newVersion.projectId, JSON.stringify(newVersion)],
    );
    return newVersion;
  };

  updateVersion = async (
    id: string,
    patch: Partial<Version>,
  ): Promise<Version> => {
    const existing = await this.queryFirst<Version>(
      "SELECT data FROM versions WHERE id = ?",
      [id],
    );
    if (!existing) {
      throw new Error(`Version not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    const db = await this.getDb();
    await db.runAsync("UPDATE versions SET data = ?, projectId = ? WHERE id = ?", [
      JSON.stringify(updated),
      updated.projectId,
      id,
    ]);
    return updated;
  };

  deleteVersion = async (id: string): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM versions WHERE id = ?", [id]);
  };

  getSavedFilters = async (ownerId?: string): Promise<SavedFilter[]> => {
    if (!ownerId) {
      const saved = await this.queryAll<SavedFilter>(
        "SELECT data FROM saved_filters",
      );
      return saved.map(normalizeSavedFilter);
    }
    const saved = await this.queryAll<SavedFilter>(
      "SELECT data FROM saved_filters WHERE ownerId = ?",
      [ownerId],
    );
    return saved.map(normalizeSavedFilter);
  };

  saveFilter = async (
    name: string,
    query: string,
    ownerId?: string,
    isJqlMode = false,
  ): Promise<SavedFilter> => {
    const newFilter: SavedFilter = {
      id: `f-${Date.now()}`,
      name,
      query,
      isJqlMode,
      ownerId: ownerId ?? this.getCurrentUserId(),
      isFavorite: false,
    };
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO saved_filters (id, ownerId, data) VALUES (?, ?, ?)",
      [newFilter.id, newFilter.ownerId, JSON.stringify(newFilter)],
    );
    return newFilter;
  };

  updateSavedFilter = async (
    id: string,
    patch: Partial<SavedFilter>,
  ): Promise<SavedFilter> => {
    const existing = await this.queryFirst<SavedFilter>(
      "SELECT data FROM saved_filters WHERE id = ?",
      [id],
    );
    if (!existing) {
      throw new Error(`Saved filter not found: ${id}`);
    }
    const normalized = normalizeSavedFilter(existing);
    const updated = {
      ...normalized,
      ...patch,
      isJqlMode:
        patch.isJqlMode ?? normalized.isJqlMode ?? false,
    };
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE saved_filters SET data = ?, ownerId = ? WHERE id = ?",
      [JSON.stringify(updated), updated.ownerId, id],
    );
    return updated;
  };

  deleteSavedFilter = async (id: string): Promise<void> => {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM saved_filters WHERE id = ?", [id]);
  };

  runAutomation = async (trigger: string, issue: Issue): Promise<void> => {
    const db = await this.getDb();
    const rules = await this.queryAll<AutomationRule>(
      "SELECT data FROM automation_rules WHERE projectId = ?",
      [issue.projectId],
    );
    for (const rule of rules) {
      if (!rule.enabled || rule.trigger !== trigger) continue;
      if (!evaluateAutomationCondition(rule.condition, issue)) continue;
      try {
        if (rule.action === "assign_reporter") {
          await this.updateIssue(issue.id, { assigneeId: issue.reporterId });
        } else if (rule.action === "add_comment") {
          await this.addComment(
            issue.id,
            "自動化ルールによってシステムコメントが追加されました。",
          );
        } else if (rule.action === "set_priority_high") {
          await this.updateIssue(issue.id, { priority: "High" });
        }

        const log: AutomationLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ruleId: rule.id,
          status: "success",
          message: `ルール「${rule.name}」が実行されました。`,
          executedAt: new Date().toISOString(),
        };
        await db.runAsync(
          "INSERT OR REPLACE INTO automation_logs (id, ruleId, status, executedAt, data) VALUES (?, ?, ?, ?, ?)",
          [log.id, log.ruleId, log.status, log.executedAt, JSON.stringify(log)],
        );
        await db.runAsync(
          "UPDATE automation_rules SET data = ? WHERE id = ?",
          [JSON.stringify({ ...rule, lastRun: log.executedAt }), rule.id],
        );
      } catch (error) {
        const log: AutomationLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ruleId: rule.id,
          status: "failure",
          message: `エラー: ${error instanceof Error ? error.message : String(error)}`,
          executedAt: new Date().toISOString(),
        };
        await db.runAsync(
          "INSERT OR REPLACE INTO automation_logs (id, ruleId, status, executedAt, data) VALUES (?, ?, ?, ?, ?)",
          [log.id, log.ruleId, log.status, log.executedAt, JSON.stringify(log)],
        );
      }
    }
  };

  getAutomationRules = async (projectId: string): Promise<AutomationRule[]> =>
    this.queryAll<AutomationRule>(
      "SELECT data FROM automation_rules WHERE projectId = ?",
      [projectId],
    );

  toggleAutomationRule = async (id: string, enabled: boolean) => {
    const existing = await this.queryFirst<AutomationRule>(
      "SELECT data FROM automation_rules WHERE id = ?",
      [id],
    );
    if (!existing) return;
    const updated = { ...existing, enabled };
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE automation_rules SET data = ?, enabled = ? WHERE id = ?",
      [JSON.stringify(updated), enabled ? 1 : 0, id],
    );
  };

  createAutomationRule = async (
    rule: Partial<AutomationRule>,
  ): Promise<AutomationRule> => {
    const newRule: AutomationRule = {
      id: `ar-${Date.now()}`,
      enabled: true,
      name: rule.name ?? "Automation rule",
      projectId: rule.projectId ?? "",
      trigger: rule.trigger ?? "issue_created",
      condition: rule.condition ?? "",
      action: rule.action ?? "add_comment",
      description: rule.description ?? "",
    };
    const db = await this.getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO automation_rules (id, projectId, enabled, data) VALUES (?, ?, ?, ?)",
      [newRule.id, newRule.projectId, 1, JSON.stringify(newRule)],
    );
    return newRule;
  };

  updateAutomationRule = async (
    id: string,
    patch: Partial<AutomationRule>,
  ): Promise<AutomationRule> => {
    const existing = await this.queryFirst<AutomationRule>(
      "SELECT data FROM automation_rules WHERE id = ?",
      [id],
    );
    if (!existing) {
      throw new Error(`Automation rule not found: ${id}`);
    }
    const updated: AutomationRule = { ...existing, ...patch };
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE automation_rules SET data = ?, enabled = ?, projectId = ? WHERE id = ?",
      [
        JSON.stringify(updated),
        updated.enabled ? 1 : 0,
        updated.projectId,
        id,
      ],
    );
    return updated;
  };

  getAutomationLogs = async (ruleId: string): Promise<AutomationLog[]> => {
    const rows = await this.queryAll<AutomationLog>(
      "SELECT data FROM automation_logs WHERE ruleId = ?",
      [ruleId],
    );
    return sortAutomationLogsByExecutedAt(rows);
  };

  setupInitialProject = async (
    name: string,
    key: string,
    type: "Scrum" | "Kanban",
  ) => {
    const project = await this.createProjectInternal({ name, key, type });
    await this.settings.set("hasSetup", "true");
    return project;
  };

  getProjectStats = async (pid: string) => {
    const issues = await this.getIssues(pid);
    return buildProjectStats(issues, SEED_USERS);
  };

  seedDemo = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM users;
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
      DELETE FROM view_history;
      DELETE FROM versions;
      DELETE FROM saved_filters;
      DELETE FROM automation_rules;
      DELETE FROM automation_logs;
    `);

    for (const user of SEED_USERS) {
      await this.upsertUser(user);
    }
    if (SEED_USERS[0]) {
      await this.setCurrentUserId(SEED_USERS[0].id);
    }

    const seedProjects = getSeedProjects();
    const [seedProject] = seedProjects;
    if (!seedProject) return;
    await this.createProjectInternal(seedProject);

    const seedSprints = getSeedSprints(seedProject.id);
    for (const sprint of seedSprints) {
      await this.createSprintInternal(sprint);
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
      await db.runAsync(
        "INSERT OR REPLACE INTO issues (id, projectId, data) VALUES (?, ?, ?)",
        [issue.id, issue.projectId, JSON.stringify(issue)],
      );
    }

    const notifications = getSeedNotifications(nowIso);
    for (const notification of notifications) {
      await db.runAsync(
        "INSERT OR REPLACE INTO notifications (id, userId, read, data) VALUES (?, ?, ?, ?)",
        [
          notification.id,
          this.getCurrentUserId(),
          notification.read ? 1 : 0,
          JSON.stringify(notification),
        ],
      );
    }
  };

  reset = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM users;
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
      DELETE FROM view_history;
      DELETE FROM versions;
      DELETE FROM saved_filters;
      DELETE FROM automation_rules;
      DELETE FROM automation_logs;
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
    this.currentUserId = "u1";
  };
}
