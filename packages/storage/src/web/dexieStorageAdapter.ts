import { liveQuery, type Table } from "dexie";
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
import type {
  AppStorage,
  AutomationRulesRepo,
  ID,
  IssuesRepo,
  NotificationsRepo,
  ProjectsRepo,
  SavedFiltersRepo,
  SettingsStore,
  SprintsRepo,
  Unsubscribe,
  VersionsRepo,
} from "../contracts";
import { JiraCloneDB } from "./db";
import { LocalStorageSettingsStore } from "./settingsStore";

const SEED_USERS: (User & { email?: string })[] = getSeedUsers();

export const USERS = SEED_USERS;

const createWatchAll = async <T>(
  table: Table<T>,
  listener: (rows: T[]) => void,
): Promise<Unsubscribe> => {
  const subscription = liveQuery(() => table.toArray()).subscribe({
    next: (rows) => listener(rows),
    error: (error) => {
      console.error("Storage watchAll error:", error);
    },
  });
  return () => subscription.unsubscribe();
};

const createWatchById = async <T>(
  table: Table<T>,
  id: ID,
  listener: (row: T | null) => void,
): Promise<Unsubscribe> => {
  const subscription = liveQuery(() => table.get(id)).subscribe({
    next: (row) => listener(row ?? null),
    error: (error) => {
      console.error("Storage watchById error:", error);
    },
  });
  return () => subscription.unsubscribe();
};

const normalizeSavedFilter = (filter: SavedFilter): SavedFilter => ({
  ...filter,
  isJqlMode: filter.isJqlMode ?? false,
});

export class DexieStorageAdapter implements AppStorage {
  db: JiraCloneDB;
  settings: SettingsStore;
  projects: ProjectsRepo;
  issues: IssuesRepo;
  sprints: SprintsRepo;
  notifications: NotificationsRepo;
  versions: VersionsRepo;
  automationRules: AutomationRulesRepo;
  savedFilters: SavedFiltersRepo;

  constructor({
    db = new JiraCloneDB(),
    settings = new LocalStorageSettingsStore(),
  }: {
    db?: JiraCloneDB;
    settings?: SettingsStore;
  } = {}) {
    this.db = db;
    this.settings = settings;

    this.projects = {
      list: () => this.getProjects(),
      get: (id) => this.getProjectById(id),
      create: (input) => this.createProject(input),
      update: (id, patch) => this.updateProjectWithResult(id, patch),
      toggleStar: (id) => this.toggleProjectStar(id),
      remove: (id) => this.deleteProject(id),
      watchAll: (listener) => createWatchAll(this.db.projects, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.projects, id, listener),
    };

    this.issues = {
      listByProject: (projectId) => this.getIssues(projectId),
      create: (input) => this.createIssue(input),
      update: (id, patch) => this.updateIssueWithResult(id, patch),
      updateStatus: (id, status) => this.updateIssueStatus(id, status),
      remove: (id) => this.deleteIssue(id),
      watchAll: (listener) => createWatchAll(this.db.issues, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.issues, id, listener),
    };

    this.sprints = {
      listByProject: (projectId) => this.getSprints(projectId),
      create: (input) => this.createSprint(input.projectId),
      start: (id) => this.updateSprintStatus(id, "active"),
      complete: (id) => this.updateSprintStatus(id, "completed"),
      watchAll: (listener) => createWatchAll(this.db.sprints, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.sprints, id, listener),
    };

    this.notifications = {
      markRead: (id) => this.markNotificationRead(id),
      markAllRead: () => this.markAllNotificationsRead(),
      watchAll: (listener) => createWatchAll(this.db.notifications, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.notifications, id, listener),
    };

    this.versions = {
      listByProject: (projectId) => this.getVersions(projectId),
      create: (input) => this.createVersion(input),
      update: (id, patch) => this.updateVersion(id, patch),
      remove: (id) => this.deleteVersion(id),
      watchAll: (listener) => createWatchAll(this.db.projectVersions, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.projectVersions, id, listener),
    };

    this.automationRules = {
      listByProject: (projectId) => this.getAutomationRules(projectId),
      create: (input) => this.createAutomationRule(input),
      update: (id, patch) => this.updateAutomationRule(id, patch),
      toggleEnabled: (id, enabled) => this.toggleAutomationRule(id, enabled),
      remove: (id) => this.deleteAutomationRule(id),
      watchAll: (listener) => createWatchAll(this.db.automationRules, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.automationRules, id, listener),
    };

    this.savedFilters = {
      listByOwner: (ownerId) => this.getSavedFilters(ownerId),
      create: (input) =>
        this.saveFilter(input.name, input.query, input.ownerId, input.isJqlMode),
      update: (id, patch) => this.updateSavedFilter(id, patch),
      remove: (id) => this.deleteSavedFilter(id),
      watchAll: (listener) => createWatchAll(this.db.savedFilters, listener),
      watchById: (id, listener) =>
        createWatchById(this.db.savedFilters, id, listener),
    };
  }

  seedDemo = async (): Promise<void> => {
    await this.db.transaction(
      "rw",
      [
        this.db.users,
        this.db.projects,
        this.db.issues,
        this.db.sprints,
        this.db.notifications,
        this.db.automationRules,
        this.db.automationLogs,
        this.db.savedFilters,
        this.db.viewHistory,
        this.db.projectVersions,
      ],
      async () => {
        await this.db.users.clear();
        await this.db.projects.clear();
        await this.db.issues.clear();
        await this.db.sprints.clear();
        await this.db.notifications.clear();
        await this.db.automationRules.clear();
        await this.db.automationLogs.clear();
        await this.db.savedFilters.clear();
        await this.db.viewHistory.clear();
        await this.db.projectVersions.clear();

        await this.db.users.bulkAdd(SEED_USERS);

        const seedProjects = getSeedProjects();
        const [seedProject] = seedProjects;
        if (!seedProject) return;
        await this.db.projects.add(seedProject);

        const seedSprints = getSeedSprints(seedProject.id);
        await this.db.sprints.bulkAdd(seedSprints);

        const nowIso = new Date().toISOString();
        const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

        const issues = getSeedIssues({
          projectId: seedProject.id,
          sprintId: seedSprints[0]?.id || "s-1",
          backlogSprintId: seedSprints[1]?.id || "s-backlog",
          nowIso,
          yesterdayIso,
        });

        await this.db.issues.bulkAdd(issues);

        const notifications = getSeedNotifications(nowIso);
        await this.db.notifications.bulkAdd(notifications);
      },
    );
  };

  reset = async (): Promise<void> => {
    try {
      try {
        this.db.close();
        await this.db.delete();
      } catch (dbError) {
        console.warn(
          "DB deletion failed, attempting to clear tables instead:",
          dbError,
        );
        if (!this.db.isOpen()) await this.db.open();
        await this.db.transaction("rw", this.db.tables, async () => {
          await Promise.all(this.db.tables.map((table) => table.clear()));
        });
      }

      const keysToRemove = [
        "isLoggedIn",
        "currentUserId",
        "hasSetup",
        "appInitialized",
        "notificationsEnabled",
      ];
      const dashboardKeys = await this.settings.keys("dashboard_gadgets_");
      await this.settings.multiRemove([...keysToRemove, ...dashboardKeys]);
    } catch (error) {
      console.error("Failed to reset storage:", error);
      await this.settings.multiRemove(["isLoggedIn", "currentUserId"]);
      throw error;
    }
  };

  getCurrentUserId = (): string => localStorage.getItem("currentUserId") || "";

  clearDatabase = async (): Promise<void> => {
    await this.db.transaction(
      "rw",
      [
        this.db.users,
        this.db.projects,
        this.db.issues,
        this.db.sprints,
        this.db.notifications,
        this.db.automationRules,
        this.db.automationLogs,
        this.db.savedFilters,
        this.db.viewHistory,
        this.db.projectVersions,
      ],
      async () => {
        await Promise.all([
          this.db.users.clear(),
          this.db.projects.clear(),
          this.db.issues.clear(),
          this.db.sprints.clear(),
          this.db.notifications.clear(),
          this.db.automationRules.clear(),
          this.db.automationLogs.clear(),
          this.db.savedFilters.clear(),
          this.db.viewHistory.clear(),
          this.db.projectVersions.clear(),
        ]);
      },
    );
  };

  checkIfDatabaseIsSeeded = async (): Promise<boolean> => {
    const user = await this.db.users.get("u1");
    return !!user;
  };

  loginAsUser = async (email: string): Promise<User | null> => {
    const user = await this.db.users.where("email").equals(email).first();
    if (user) {
      return user;
    }
    return null;
  };

  registerUser = async (email: string, name: string): Promise<User> => {
    const newUser = {
      id: `u-${Date.now()}`,
      name: name,
      email: email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    };
    await this.db.users.add(newUser);
    return newUser;
  };

  getUserById = async (id: string): Promise<User | undefined> => {
    return this.db.users.get(id);
  };

  getCurrentUser = async (): Promise<User | undefined> => {
    const id = this.getCurrentUserId();
    if (!id) return undefined;
    return this.db.users.get(id);
  };

  updateUser = async (id: string, updates: Partial<User>): Promise<number> => {
    return this.db.users.update(id, updates);
  };

  getUserStats = async (uid: string) => {
    if (!uid) return { assigned: 0, reported: 0, leading: 0 };
    const assigned = await this.db.issues
      .where("assigneeId")
      .equals(uid)
      .count();
    const reported = await this.db.issues
      .where("reporterId")
      .equals(uid)
      .count();
    const leading = await this.db.projects.where("leadId").equals(uid).count();
    return { assigned, reported, leading };
  };

  getProjects = async (): Promise<Project[]> => {
    return this.db.projects.toArray();
  };

  getProjectById = async (id: string): Promise<Project | undefined> => {
    return this.db.projects.get(id);
  };

  createProject = async (project: Partial<Project>): Promise<Project> => {
    const newProject = {
      id: `p-${Date.now()}`,
      leadId: this.getCurrentUserId(),
      category: "Software",
      type: "Kanban",
      starred: false,
      workflowSettings: WORKFLOW_TRANSITIONS,
      notificationSettings: DEFAULT_NOTIFICATION_SCHEME,
      ...project,
    } as Project;
    await this.db.projects.add(newProject);
    return newProject;
  };

  updateProject = async (
    id: string,
    updates: Partial<Project>,
  ): Promise<number> => {
    return this.db.projects.update(id, updates);
  };

  updateProjectWithResult = async (
    id: string,
    updates: Partial<Project>,
  ): Promise<Project> => {
    await this.db.projects.update(id, updates);
    const updated = await this.db.projects.get(id);
    if (!updated) {
      throw new Error(`Project not found: ${id}`);
    }
    return updated;
  };

  deleteProject = async (id: string): Promise<void> => {
    await this.db.projects.delete(id);
  };

  toggleProjectStar = async (projectId: string): Promise<void> => {
    const project = await this.db.projects.get(projectId);
    if (project) {
      await this.db.projects.update(projectId, { starred: !project.starred });
    }
  };

  hasPermission = (userId: string, action: string, project?: Project) => {
    if (userId === "u1") return true;
    if (action === "manage_project") return userId === "u2";
    return true;
  };

  private dispatchProjectNotification = async (
    projectId: string,
    event: string,
    issue: Issue,
  ) => {
    const project = await this.db.projects.get(projectId);
    const scheme = project?.notificationSettings || DEFAULT_NOTIFICATION_SCHEME;
    const recipients = scheme[event] || [];
    const curUser = this.getCurrentUserId();

    const targetUserIds = new Set<string>();

    if (recipients.includes("Reporter") && issue.reporterId)
      targetUserIds.add(issue.reporterId);
    if (recipients.includes("Assignee") && issue.assigneeId)
      targetUserIds.add(issue.assigneeId);
    if (recipients.includes("Watcher"))
      (issue.watcherIds || []).forEach((id) => targetUserIds.add(id));

    if (targetUserIds.has(curUser)) targetUserIds.delete(curUser);

    let title = "通知";
    let description = issue.title;

    if (event === "issue_created")
      title = `新しい課題が作成されました: ${issue.key}`;
    if (event === "issue_assigned")
      title = `課題があなたに割り当てられました: ${issue.key}`;
    if (event === "status_changed")
      title = `課題のステータスが「${STATUS_LABELS[issue.status as IssueStatus]}」に変更されました`;
    if (event === "comment_added")
      title = `新しいコメントが追加されました: ${issue.key}`;
    if (event === "issue_resolved")
      title = `課題が解決されました: ${issue.key}`;

    for (const userId of targetUserIds) {
      await this.createNotification({
        title,
        description,
        type: event === "comment_added" ? "mention" : "system",
        issueId: issue.id,
      });
    }
  };

  private createNotification = async (notif: Partial<Notification>) => {
    await this.db.notifications.add({
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: notif.title || "システム通知",
      description: notif.description || "",
      read: false,
      createdAt: new Date().toISOString(),
      type: notif.type || "system",
      issueId: notif.issueId,
    } as Notification);
  };

  getNotifications = async (): Promise<Notification[]> => {
    return this.db.notifications.orderBy("createdAt").reverse().toArray();
  };

  getUnreadMentionCount = async (): Promise<number> => {
    return this.db.notifications.filter((n) => !n.read).count();
  };

  markNotificationRead = async (id: string): Promise<number> => {
    return this.db.notifications.update(id, { read: true });
  };

  markAllNotificationsRead = async (): Promise<number> => {
    return this.db.notifications.toCollection().modify({ read: true });
  };

  runAutomation = async (trigger: string, issue: Issue) => {
    const rules = await this.db.automationRules
      .where("projectId")
      .equals(issue.projectId)
      .filter((r) => r.trigger === trigger && r.enabled)
      .toArray();

    for (const rule of rules) {
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

        await this.db.automationLogs.add({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ruleId: rule.id,
          status: "success",
          message: `ルール「${rule.name}」が実行されました。`,
          executedAt: new Date().toISOString(),
        });
        await this.db.automationRules.update(rule.id, {
          lastRun: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Automation error:", e);
        await this.db.automationLogs.add({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ruleId: rule.id,
          status: "failure",
          message: `エラー: ${e instanceof Error ? e.message : String(e)}`,
          executedAt: new Date().toISOString(),
        });
      }
    }
  };

  getAutomationRules = async (projectId: string): Promise<AutomationRule[]> => {
    return this.db.automationRules
      .where("projectId")
      .equals(projectId)
      .toArray();
  };

  toggleAutomationRule = async (
    id: string,
    enabled: boolean,
  ): Promise<number> => {
    return this.db.automationRules.update(id, { enabled });
  };

  createAutomationRule = async (
    rule: Partial<AutomationRule>,
  ): Promise<AutomationRule> => {
    const newRule = {
      id: `ar-${Date.now()}`,
      enabled: true,
      ...rule,
    } as AutomationRule;
    await this.db.automationRules.add(newRule);
    return newRule;
  };

  updateAutomationRule = async (
    id: string,
    patch: Partial<AutomationRule>,
  ): Promise<AutomationRule> => {
    await this.db.automationRules.update(id, patch);
    const updated = await this.db.automationRules.get(id);
    if (!updated) {
      throw new Error(`Automation rule not found: ${id}`);
    }
    return updated;
  };

  deleteAutomationRule = async (id: string): Promise<void> => {
    await this.db.automationRules.delete(id);
  };

  getAutomationLogs = async (ruleId: string): Promise<AutomationLog[]> => {
    const logs = await this.db.automationLogs
      .where("ruleId")
      .equals(ruleId)
      .toArray();
    return sortAutomationLogsByExecutedAt(logs);
  };

  getIssueById = async (id: string): Promise<Issue | undefined> => {
    return this.db.issues.get(id);
  };

  getIssues = async (projectId?: string): Promise<Issue[]> => {
    if (projectId) {
      return this.db.issues.where("projectId").equals(projectId).toArray();
    }
    return this.db.issues.toArray();
  };

  getIssuesForUser = async (userId: string): Promise<Issue[]> => {
    return this.db.issues.where("assigneeId").equals(userId).toArray();
  };

  createIssue = async (issue: Partial<Issue>): Promise<Issue> => {
    const project = await this.db.projects.get(issue.projectId!);
    const count = await this.db.issues
      .where("projectId")
      .equals(issue.projectId!)
      .count();
    const curUser = this.getCurrentUserId();
    const newIssue: Issue = {
      id: `i-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      key: `${project?.key}-${count + 101}`,
      projectId: issue.projectId!,
      title: issue.title || "無題",
      type: issue.type || "Task",
      status: issue.status || "To Do",
      priority: issue.priority || "Medium",
      reporterId: curUser,
      assigneeId: issue.assigneeId,
      labels: [],
      comments: [],
      workLogs: [],
      history: [
        {
          id: `h-${Date.now()}`,
          authorId: curUser,
          field: "status",
          from: null,
          to: issue.status || "To Do",
          createdAt: new Date().toISOString(),
        },
      ],
      links: [],
      attachments: [],
      watcherIds: [curUser],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...issue,
    } as Issue;

    await this.db.issues.add(newIssue);

    await this.dispatchProjectNotification(
      newIssue.projectId,
      "issue_created",
      newIssue,
    );
    if (newIssue.assigneeId && newIssue.assigneeId !== curUser) {
      await this.dispatchProjectNotification(
        newIssue.projectId,
        "issue_assigned",
        newIssue,
      );
    }

    await this.runAutomation("issue_created", newIssue);
    return newIssue;
  };

  updateIssue = async (
    id: string,
    updates: Partial<Issue>,
  ): Promise<Issue | false | undefined> => {
    const old = await this.db.issues.get(id);
    if (!old) return;
    const curUser = this.getCurrentUserId();
    const project = await this.db.projects.get(old.projectId);

    if (updates.status && updates.status !== old.status) {
      const workflow = project?.workflowSettings || WORKFLOW_TRANSITIONS;
      const allowed = workflow[old.status] || [];
      if (!allowed.includes(updates.status)) {
        return false;
      }
    }

    const historyEntries: any[] = [];
    const changes: any = { ...updates, updatedAt: new Date().toISOString() };

    for (const [key, value] of Object.entries(updates)) {
      if ((old as any)[key] !== value) {
        historyEntries.push({
          id: `h-${Date.now()}-${key}`,
          authorId: curUser,
          field: key,
          from: (old as any)[key],
          to: value,
          createdAt: new Date().toISOString(),
        });

        if (key === "assigneeId" && value && value !== curUser) {
          await this.dispatchProjectNotification(
            old.projectId,
            "issue_assigned",
            old,
          );
        }

        if (key === "status") {
          const event = value === "Done" ? "issue_resolved" : "status_changed";
          const updatedObj = { ...old, status: value as IssueStatus };
          await this.dispatchProjectNotification(
            old.projectId,
            event,
            updatedObj as Issue,
          );
        }
      }
    }

    const newHistory = [...(old.history || []), ...historyEntries];
    await this.db.issues.update(id, { ...changes, history: newHistory });

    const updated = await this.db.issues.get(id);
    if (updates.status && updates.status !== old.status && updated) {
      await this.runAutomation("status_changed", updated);
    }
    return updated;
  };

  updateIssueWithResult = async (
    id: string,
    updates: Partial<Issue>,
  ): Promise<Issue> => {
    const updated = await this.updateIssue(id, updates);
    if (!updated || updated === false) {
      throw new Error(`Issue update rejected for ${id}`);
    }
    return updated;
  };

  updateIssueStatus = async (id: string, status: IssueStatus) => {
    const result = await this.updateIssue(id, { status });
    if (result === false) {
      alert(`ステータス遷移が許可されていません: ${status}`);
      return undefined;
    }
    return result;
  };

  deleteIssue = async (id: string): Promise<boolean> => {
    const issue = await this.db.issues.get(id);
    if (issue && this.hasPermission(this.getCurrentUserId(), "delete_issue")) {
      await this.db.issues.delete(id);
      return true;
    }
    return false;
  };

  addAttachment = async (issueId: string, file: File) => {
    const issue = await this.db.issues.get(issueId);
    if (!issue) return;

    const reader = new FileReader();
    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        const newAttachment: Attachment = {
          id: `at-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        const attachments = [...(issue.attachments || []), newAttachment];
        await this.db.issues.update(issueId, {
          attachments,
          updatedAt: new Date().toISOString(),
        });
        resolve();
      };
      reader.onerror = () => reject(new Error("File upload failed"));
      reader.readAsDataURL(file);
    });
  };

  addComment = async (id: string, text: string) => {
    const issue = await this.db.issues.get(id);
    if (issue) {
      const curUser = this.getCurrentUserId();
      const comments = [
        ...(issue.comments || []),
        {
          id: `c-${Date.now()}`,
          authorId: curUser,
          content: text,
          createdAt: new Date().toISOString(),
        },
      ];
      await this.db.issues.update(id, {
        comments,
        updatedAt: new Date().toISOString(),
      });

      await this.dispatchProjectNotification(
        issue.projectId,
        "comment_added",
        issue,
      );

      await this.runAutomation("comment_added", issue);
    }
  };

  getSubtasks = async (parentId: string): Promise<Issue[]> => {
    return this.db.issues.where("parentId").equals(parentId).toArray();
  };

  addIssueLink = async (issueId: string, targetId: string, type: LinkType) => {
    const issue = await this.db.issues.get(issueId);
    if (!issue) return;
    const links = [
      ...(issue.links || []),
      { id: `l-${Date.now()}`, type, outwardIssueId: targetId },
    ];
    return this.db.issues.update(issueId, { links });
  };

  logWork = async (issueId: string, seconds: number, comment?: string) => {
    const issue = await this.db.issues.get(issueId);
    if (!issue) return;
    const newLog: WorkLog = {
      id: `wl-${Date.now()}`,
      authorId: this.getCurrentUserId(),
      timeSpentSeconds: seconds,
      comment,
      createdAt: new Date().toISOString(),
    };
    const workLogs = [...(issue.workLogs || []), newLog];
    return this.db.issues.update(issueId, {
      workLogs,
      updatedAt: new Date().toISOString(),
    });
  };

  toggleWatch = async (issueId: string) => {
    const issue = await this.db.issues.get(issueId);
    if (!issue) return;
    const curUser = this.getCurrentUserId();
    const watcherIds = issue.watcherIds || [];
    const index = watcherIds.indexOf(curUser);
    if (index > -1) {
      watcherIds.splice(index, 1);
    } else {
      watcherIds.push(curUser);
    }
    return this.db.issues.update(issueId, { watcherIds });
  };

  recordView = async (issueId: string) => {
    const curUser = this.getCurrentUserId();
    const id = `${curUser}-${issueId}`;
    return this.db.viewHistory.put({
      id,
      userId: curUser,
      issueId,
      viewedAt: new Date().toISOString(),
    } as ViewHistory);
  };

  getRecentIssues = async (): Promise<Issue[]> => {
    const curUser = this.getCurrentUserId();
    const history = await this.db.viewHistory
      .where("userId")
      .equals(curUser)
      .toArray();

    const issueIds = [...new Set(history.map((h) => h.issueId))];
    if (issueIds.length === 0) return [];

    const issues = await this.db.issues.where("id").anyOf(issueIds).toArray();

    return selectRecentIssues(history, issues);
  };

  getSprints = async (projectId: string): Promise<Sprint[]> => {
    return this.db.sprints.where("projectId").equals(projectId).toArray();
  };

  createSprint = async (projectId: string): Promise<Sprint> => {
    const count = await this.db.sprints
      .where("projectId")
      .equals(projectId)
      .count();
    const newSprint: Sprint = {
      id: `s-${Date.now()}`,
      name: `Sprint ${count + 1}`,
      projectId,
      status: "future",
    };
    await this.db.sprints.add(newSprint);
    return newSprint;
  };

  updateSprintStatus = async (
    id: string,
    status: "active" | "future" | "completed",
  ): Promise<number> => {
    return this.db.sprints.update(id, { status });
  };

  getVersions = async (projectId: string): Promise<Version[]> => {
    return this.db.projectVersions
      .where("projectId")
      .equals(projectId)
      .toArray();
  };

  createVersion = async (version: Partial<Version>): Promise<Version> => {
    const newVersion = {
      id: `v-${Date.now()}`,
      status: "unreleased",
      ...version,
    } as Version;
    await this.db.projectVersions.add(newVersion);
    return newVersion;
  };

  updateVersion = async (
    id: string,
    patch: Partial<Version>,
  ): Promise<Version> => {
    await this.db.projectVersions.update(id, patch);
    const updated = await this.db.projectVersions.get(id);
    if (!updated) {
      throw new Error(`Version not found: ${id}`);
    }
    return updated;
  };

  deleteVersion = async (id: string): Promise<void> => {
    await this.db.projectVersions.delete(id);
  };

  getSavedFilters = async (ownerId?: string): Promise<SavedFilter[]> => {
    const all = await this.db.savedFilters.toArray();
    const normalized = all.map(normalizeSavedFilter);
    if (!ownerId) return normalized;
    return normalized.filter((filter) => filter.ownerId === ownerId);
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
      ownerId: ownerId || this.getCurrentUserId(),
      isFavorite: false,
    };
    await this.db.savedFilters.add(newFilter);
    return newFilter;
  };

  updateSavedFilter = async (
    id: string,
    patch: Partial<SavedFilter>,
  ): Promise<SavedFilter> => {
    await this.db.savedFilters.update(id, patch);
    const updated = await this.db.savedFilters.get(id);
    if (!updated) {
      throw new Error(`Saved filter not found: ${id}`);
    }
    return normalizeSavedFilter(updated);
  };

  deleteSavedFilter = async (id: string): Promise<void> => {
    await this.db.savedFilters.delete(id);
  };

  setupInitialProject = async (
    name: string,
    key: string,
    type: "Scrum" | "Kanban",
  ) => {
    const project = await this.createProject({ name, key, type });
    localStorage.setItem("hasSetup", "true");
    return project;
  };

  getProjectStats = async (pid: string) => {
    const issues = await this.db.issues
      .where("projectId")
      .equals(pid)
      .toArray();
    return buildProjectStats(issues, SEED_USERS);
  };
}
