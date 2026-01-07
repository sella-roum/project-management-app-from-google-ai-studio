import * as SQLite from "expo-sqlite";

import type {
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
  WorkLog,
} from "@repo/core";
import {
  buildProjectStats,
  DEFAULT_NOTIFICATION_SCHEME,
  getSeedIssues,
  getSeedNotifications,
  getSeedProjects,
  getSeedSprints,
  getSeedUsers,
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
};

const noopUnsubscribe: Unsubscribe = () => undefined;
const SEED_USERS: User[] = getSeedUsers();

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
      update: (id, patch) => this.updateIssueInternal(id, patch),
      updateStatus: (id, status) => this.updateIssueInternal(id, { status }),
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
        read INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL
      );
    `);
    const storedUserId = await this.settings.get("currentUserId");
    if (storedUserId) {
      this.currentUserId = storedUserId;
    } else {
      await this.settings.set("currentUserId", this.currentUserId);
    }
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

  private updateIssueInternal = async (
    id: ID,
    patch: Partial<Issue>,
  ): Promise<Issue> => {
    const existing = await this.getIssueByIdInternal(id);
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

  getCurrentUserId = (): string => this.currentUserId;

  clearDatabase = async (): Promise<void> => {
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM notifications;
      DELETE FROM issues;
      DELETE FROM sprints;
      DELETE FROM projects;
      DELETE FROM users;
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
    _userId: string,
    _action: string,
    _project?: Project,
  ): boolean => true;

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
  ): Promise<Issue> => this.updateIssueInternal(id, updates);

  getIssuesForUser = async (userId: string): Promise<Issue[]> => {
    const issues = await this.queryAll<Issue>("SELECT data FROM issues");
    return issues.filter((issue) => issue.assigneeId === userId);
  };

  updateIssueStatus = async (id: string, status: IssueStatus) =>
    this.updateIssueInternal(id, { status });

  deleteIssue = async (id: string): Promise<void> =>
    this.removeIssueInternal(id);

  addAttachment = async (_issueId: string, _file: File): Promise<void> =>
    undefined;

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
    await this.updateIssueInternal(id, { comments });
  };

  addIssueLink = async (
    _issueId: string,
    _targetId: string,
    _type: LinkType,
  ) => undefined;

  getSubtasks = async (_parentId: string): Promise<Issue[]> => [];

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
    await this.updateIssueInternal(issueId, { workLogs });
  };

  toggleWatch = async (issueId: string): Promise<void> => {
    const issue = await this.getIssueByIdInternal(issueId);
    if (!issue) return;
    const currentUserId = this.getCurrentUserId();
    const watcherIds = issue.watcherIds ?? [];
    const index = watcherIds.indexOf(currentUserId);
    if (index >= 0) {
      watcherIds.splice(index, 1);
    } else {
      watcherIds.push(currentUserId);
    }
    await this.updateIssueInternal(issueId, { watcherIds });
  };

  recordView = async (_issueId: string): Promise<void> => undefined;

  getRecentIssues = async (): Promise<Issue[]> => [];

  getSprints = async (projectId: string): Promise<Sprint[]> =>
    this.listSprintsInternal(projectId);

  createSprint = async (projectId: string): Promise<Sprint> =>
    this.createSprintInternal({ projectId, name: `Sprint ${Date.now()}` });

  updateSprintStatus = async (
    id: string,
    status: "active" | "future" | "completed",
  ): Promise<Sprint> => this.updateSprintInternal(id, { status });

  getVersions = async (_projectId: string): Promise<Version[]> => [];

  createVersion = async (version: Partial<Version>): Promise<Version> => ({
    id: `v-${Date.now()}`,
    status: "unreleased",
    ...version,
  });

  updateVersion = async (
    id: string,
    patch: Partial<Version>,
  ): Promise<Version> => ({
    id,
    status: patch.status ?? "unreleased",
    ...patch,
  });

  deleteVersion = async (_id: string): Promise<void> => undefined;

  getSavedFilters = async (_ownerId?: string): Promise<SavedFilter[]> => [];

  saveFilter = async (
    name: string,
    query: string,
    ownerId?: string,
  ): Promise<SavedFilter> => ({
    id: `f-${Date.now()}`,
    name,
    query,
    ownerId: ownerId ?? this.getCurrentUserId(),
    isFavorite: false,
  });

  updateSavedFilter = async (
    id: string,
    patch: Partial<SavedFilter>,
  ): Promise<SavedFilter> => ({
    id,
    name: patch.name ?? "Saved filter",
    query: patch.query ?? "",
    ownerId: patch.ownerId ?? this.getCurrentUserId(),
    isFavorite: patch.isFavorite ?? false,
  });

  deleteSavedFilter = async (_id: string): Promise<void> => undefined;

  runAutomation = async (
    _trigger: string,
    _issue: Issue,
  ): Promise<void> => undefined;

  getAutomationRules = async (
    _projectId: string,
  ): Promise<AutomationRule[]> => [];

  toggleAutomationRule = async (_id: string, _enabled: boolean) => undefined;

  createAutomationRule = async (
    rule: Partial<AutomationRule>,
  ): Promise<AutomationRule> => ({
    id: `ar-${Date.now()}`,
    enabled: true,
    name: rule.name ?? "Automation rule",
    projectId: rule.projectId ?? "",
    trigger: rule.trigger ?? "issue_created",
    condition: rule.condition ?? {},
    action: rule.action ?? "add_comment",
  });

  getAutomationLogs = async (_ruleId: string): Promise<AutomationLog[]> => [];

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
      await this.createIssueInternal(issue);
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
      DELETE FROM users;
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
    this.currentUserId = "u1";
  };
}
