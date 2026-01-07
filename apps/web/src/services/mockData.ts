import { Dexie, Table } from "dexie";
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
import {
  Issue,
  Project,
  User,
  Sprint,
  Notification,
  IssueStatus,
  Version,
  AutomationRule,
  SavedFilter,
  ViewHistory,
  WorkLog,
  AutomationLog,
  Attachment,
  LinkType,
} from "../types";

export const getCurrentUserId = () =>
  localStorage.getItem("currentUserId") || "";

class JiraCloneDB extends Dexie {
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

export const db = new JiraCloneDB();

const SEED_USERS: (User & { email?: string })[] = getSeedUsers();

export const USERS = SEED_USERS;

export const seedDatabase = async () => {
  await db.transaction(
    "rw",
    [
      db.users,
      db.projects,
      db.issues,
      db.sprints,
      db.notifications,
      db.automationRules,
      db.automationLogs,
      db.savedFilters,
      db.viewHistory,
      db.projectVersions,
    ],
    async () => {
      await db.users.clear();
      await db.projects.clear();
      await db.issues.clear();
      await db.sprints.clear();
      await db.notifications.clear();
      await db.automationRules.clear();
      await db.automationLogs.clear();
      await db.savedFilters.clear();
      await db.viewHistory.clear();
      await db.projectVersions.clear();

      await db.users.bulkAdd(SEED_USERS);

      const seedProjects = getSeedProjects();
      const [seedProject] = seedProjects;
      if (!seedProject) return;
      await db.projects.add(seedProject);

      const seedSprints = getSeedSprints(seedProject.id);
      await db.sprints.bulkAdd(seedSprints);

      const nowIso = new Date().toISOString();
      const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

      const issues = getSeedIssues({
        projectId: seedProject.id,
        sprintId: seedSprints[0]?.id || "s-1",
        backlogSprintId: seedSprints[1]?.id || "s-backlog",
        nowIso,
        yesterdayIso,
      });

      await db.issues.bulkAdd(issues);

      const notifications = getSeedNotifications(nowIso);
      await db.notifications.bulkAdd(notifications);
    },
  );
};

export const clearDatabase = async () => {
  await db.transaction(
    "rw",
    [
      db.users,
      db.projects,
      db.issues,
      db.sprints,
      db.notifications,
      db.automationRules,
      db.automationLogs,
      db.savedFilters,
      db.viewHistory,
      db.projectVersions,
    ],
    async () => {
      await Promise.all([
        db.users.clear(),
        db.projects.clear(),
        db.issues.clear(),
        db.sprints.clear(),
        db.notifications.clear(),
        db.automationRules.clear(),
        db.automationLogs.clear(),
        db.savedFilters.clear(),
        db.viewHistory.clear(),
        db.projectVersions.clear(),
      ]);
    },
  );
};

export const checkIfDatabaseIsSeeded = async () => {
  const user = await db.users.get("u1");
  return !!user;
};

export const loginAsUser = async (email: string) => {
  const user = await db.users.where("email").equals(email).first();
  if (user) {
    return user;
  }
  return null;
};

export const registerUser = async (email: string, name: string) => {
  const newUser = {
    id: `u-${Date.now()}`,
    name: name,
    email: email,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
  };
  await db.users.add(newUser);
  return newUser;
};

export const getCurrentUser = async () => {
  const id = getCurrentUserId();
  if (!id) return undefined;
  return db.users.get(id);
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  return db.users.update(id, updates);
};

export const getUserStats = async (uid: string) => {
  if (!uid) return { assigned: 0, reported: 0, leading: 0 };
  const assigned = await db.issues.where("assigneeId").equals(uid).count();
  const reported = await db.issues.where("reporterId").equals(uid).count();
  const leading = await db.projects.where("leadId").equals(uid).count();
  return { assigned, reported, leading };
};

export const getProjects = async () => {
  return db.projects.toArray();
};

export const getProjectById = async (id: string) => {
  return db.projects.get(id);
};

export const createProject = async (project: Partial<Project>) => {
  const newProject = {
    id: `p-${Date.now()}`,
    leadId: getCurrentUserId(),
    category: "Software",
    type: "Kanban",
    starred: false,
    workflowSettings: WORKFLOW_TRANSITIONS,
    notificationSettings: DEFAULT_NOTIFICATION_SCHEME,
    ...project,
  } as Project;
  await db.projects.add(newProject);
  return newProject;
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  return db.projects.update(id, updates);
};

export const deleteProject = async (id: string) => {
  return db.projects.delete(id);
};

export const toggleProjectStar = async (projectId: string) => {
  const project = await db.projects.get(projectId);
  if (project) {
    await db.projects.update(projectId, { starred: !project.starred });
  }
};

export const hasPermission = (
  userId: string,
  action: string,
  project?: Project,
) => {
  if (userId === "u1") return true;
  if (action === "manage_project") return userId === "u2";
  return true;
};

// Internal helper for dispatching notifications based on scheme
const dispatchProjectNotification = async (
  projectId: string,
  event: string,
  issue: Issue,
  context?: any,
) => {
  const project = await db.projects.get(projectId);
  const scheme = project?.notificationSettings || DEFAULT_NOTIFICATION_SCHEME;
  const recipients = scheme[event] || [];
  const curUser = getCurrentUserId();

  const targetUserIds = new Set<string>();

  if (recipients.includes("Reporter") && issue.reporterId)
    targetUserIds.add(issue.reporterId);
  if (recipients.includes("Assignee") && issue.assigneeId)
    targetUserIds.add(issue.assigneeId);
  if (recipients.includes("Watcher"))
    (issue.watcherIds || []).forEach((id) => targetUserIds.add(id));

  // Don't notify self
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
  if (event === "issue_resolved") title = `課題が解決されました: ${issue.key}`;

  for (const userId of targetUserIds) {
    await createNotification({
      title,
      description,
      type: event === "comment_added" ? "mention" : "system",
      issueId: issue.id,
    });
  }
};

const createNotification = async (notif: Partial<Notification>) => {
  await db.notifications.add({
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: notif.title || "システム通知",
    description: notif.description || "",
    read: false,
    createdAt: new Date().toISOString(),
    type: notif.type || "system",
    issueId: notif.issueId,
  } as Notification);
};

export const getNotifications = async () => {
  return db.notifications.orderBy("createdAt").reverse().toArray();
};

export const getUnreadMentionCount = async () => {
  return db.notifications.filter((n) => !n.read).count();
};

export const markNotificationRead = async (id: string) => {
  return db.notifications.update(id, { read: true });
};

export const markAllNotificationsRead = async () => {
  return db.notifications.toCollection().modify({ read: true });
};

const evaluateCondition = (condition: string, issue: Issue): boolean =>
  evaluateAutomationCondition(condition, issue);

export const runAutomation = async (trigger: string, issue: Issue) => {
  const rules = await db.automationRules
    .where("projectId")
    .equals(issue.projectId)
    .filter((r) => r.trigger === trigger && r.enabled)
    .toArray();

  for (const rule of rules) {
    if (!evaluateCondition(rule.condition, issue)) continue;

    try {
      if (rule.action === "assign_reporter") {
        await updateIssue(issue.id, { assigneeId: issue.reporterId });
      } else if (rule.action === "add_comment") {
        await addComment(
          issue.id,
          "自動化ルールによってシステムコメントが追加されました。",
        );
      } else if (rule.action === "set_priority_high") {
        await updateIssue(issue.id, { priority: "High" });
      }

      await db.automationLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ruleId: rule.id,
        status: "success",
        message: `ルール「${rule.name}」が実行されました。`,
        executedAt: new Date().toISOString(),
      });
      await db.automationRules.update(rule.id, {
        lastRun: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Automation error:", e);
      await db.automationLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ruleId: rule.id,
        status: "failure",
        message: `エラー: ${e instanceof Error ? e.message : String(e)}`,
        executedAt: new Date().toISOString(),
      });
    }
  }
};

export const getAutomationRules = async (projectId: string) => {
  return db.automationRules.where("projectId").equals(projectId).toArray();
};

export const toggleAutomationRule = async (id: string, enabled: boolean) => {
  return db.automationRules.update(id, { enabled });
};

export const createAutomationRule = async (rule: Partial<AutomationRule>) => {
  const newRule = {
    id: `ar-${Date.now()}`,
    enabled: true,
    ...rule,
  } as AutomationRule;
  await db.automationRules.add(newRule);
  return newRule;
};

export const getAutomationLogs = async (ruleId: string) => {
  const logs = await db.automationLogs.where("ruleId").equals(ruleId).toArray();
  return sortAutomationLogsByExecutedAt(logs);
};

export const getIssueById = async (id: string) => {
  return db.issues.get(id);
};

export const getIssues = async (projectId?: string) => {
  if (projectId) {
    return db.issues.where("projectId").equals(projectId).toArray();
  }
  return db.issues.toArray();
};

export const getIssuesForUser = async (userId: string) => {
  return db.issues.where("assigneeId").equals(userId).toArray();
};

export const createIssue = async (issue: Partial<Issue>) => {
  const project = await db.projects.get(issue.projectId!);
  const count = await db.issues
    .where("projectId")
    .equals(issue.projectId!)
    .count();
  const curUser = getCurrentUserId();
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

  await db.issues.add(newIssue);

  // Dynamic Notifications
  await dispatchProjectNotification(
    newIssue.projectId,
    "issue_created",
    newIssue,
  );
  if (newIssue.assigneeId && newIssue.assigneeId !== curUser) {
    await dispatchProjectNotification(
      newIssue.projectId,
      "issue_assigned",
      newIssue,
    );
  }

  await runAutomation("issue_created", newIssue);
  return newIssue;
};

export const updateIssue = async (id: string, updates: Partial<Issue>) => {
  const old = await db.issues.get(id);
  if (!old) return;
  const curUser = getCurrentUserId();
  const project = await db.projects.get(old.projectId);

  // Workflow Validation
  if (updates.status && updates.status !== old.status) {
    const workflow = project?.workflowSettings || WORKFLOW_TRANSITIONS;
    const allowed = workflow[old.status] || [];
    // Allow if it's the same status (redundant check but safe) or if in allowed transitions
    // Bypass for 'u1' (admin-ish) could be added here, but prompt asks for enforcement.
    // If empty list, assume any transition allowed (fallback)? No, assume strict.
    // If key missing in workflow, assume standard transitions.
    if (!allowed.includes(updates.status)) {
      // We'll return false here to indicate failure to the UI
      // UI should ideally handle this rejection
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

      // Dynamic Notifications
      if (key === "assigneeId" && value && value !== curUser) {
        await dispatchProjectNotification(old.projectId, "issue_assigned", old);
      }

      if (key === "status") {
        const event = value === "Done" ? "issue_resolved" : "status_changed";
        // Mock updated issue object for notification context
        const updatedObj = { ...old, status: value as IssueStatus };
        await dispatchProjectNotification(
          old.projectId,
          event,
          updatedObj as Issue,
        );
      }
    }
  }

  const newHistory = [...(old.history || []), ...historyEntries];
  await db.issues.update(id, { ...changes, history: newHistory });

  const updated = await db.issues.get(id);
  if (updates.status && updates.status !== old.status && updated) {
    await runAutomation("status_changed", updated);
  }
  return updated;
};

export const updateIssueStatus = async (id: string, status: IssueStatus) => {
  const result = await updateIssue(id, { status });
  if (result === false) {
    // Ideally we throw or toast, but for this mock implementation we'll alert window
    alert(`ステータス遷移が許可されていません: ${status}`);
    return undefined;
  }
  return result;
};

export const deleteIssue = async (id: string) => {
  const issue = await db.issues.get(id);
  if (issue && hasPermission(getCurrentUserId(), "delete_issue")) {
    await db.issues.delete(id);
    return true;
  }
  return false;
};

export const addAttachment = async (issueId: string, file: File) => {
  const issue = await db.issues.get(issueId);
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
      await db.issues.update(issueId, {
        attachments,
        updatedAt: new Date().toISOString(),
      });
      resolve();
    };
    reader.onerror = () => reject(new Error("File upload failed"));
    reader.readAsDataURL(file);
  });
};

export const addComment = async (id: string, text: string) => {
  const issue = await db.issues.get(id);
  if (issue) {
    const curUser = getCurrentUserId();
    const comments = [
      ...(issue.comments || []),
      {
        id: `c-${Date.now()}`,
        authorId: curUser,
        content: text,
        createdAt: new Date().toISOString(),
      },
    ];
    await db.issues.update(id, {
      comments,
      updatedAt: new Date().toISOString(),
    });

    // Dynamic Notifications
    await dispatchProjectNotification(issue.projectId, "comment_added", issue);

    await runAutomation("comment_added", issue);
  }
};

export const getSubtasks = async (parentId: string) => {
  return db.issues.where("parentId").equals(parentId).toArray();
};

export const addIssueLink = async (
  issueId: string,
  targetId: string,
  type: LinkType,
) => {
  const issue = await db.issues.get(issueId);
  if (!issue) return;
  const links = [
    ...(issue.links || []),
    { id: `l-${Date.now()}`, type, outwardIssueId: targetId },
  ];
  return db.issues.update(issueId, { links });
};

export const logWork = async (
  issueId: string,
  seconds: number,
  comment?: string,
) => {
  const issue = await db.issues.get(issueId);
  if (!issue) return;
  const newLog: WorkLog = {
    id: `wl-${Date.now()}`,
    authorId: getCurrentUserId(),
    timeSpentSeconds: seconds,
    comment,
    createdAt: new Date().toISOString(),
  };
  const workLogs = [...(issue.workLogs || []), newLog];
  return db.issues.update(issueId, {
    workLogs,
    updatedAt: new Date().toISOString(),
  });
};

export const toggleWatch = async (issueId: string) => {
  const issue = await db.issues.get(issueId);
  if (!issue) return;
  const curUser = getCurrentUserId();
  const watcherIds = issue.watcherIds || [];
  const index = watcherIds.indexOf(curUser);
  if (index > -1) {
    watcherIds.splice(index, 1);
  } else {
    watcherIds.push(curUser);
  }
  return db.issues.update(issueId, { watcherIds });
};

export const recordView = async (issueId: string) => {
  const curUser = getCurrentUserId();
  const id = `${curUser}-${issueId}`;
  return db.viewHistory.put({
    id,
    userId: curUser,
    issueId,
    viewedAt: new Date().toISOString(),
  });
};

export const getRecentIssues = async () => {
  const curUser = getCurrentUserId();
  const history = await db.viewHistory
    .where("userId")
    .equals(curUser)
    .toArray();

  const issueIds = [...new Set(history.map((h) => h.issueId))];
  if (issueIds.length === 0) return [];

  const issues = await db.issues.where("id").anyOf(issueIds).toArray();

  return selectRecentIssues(history, issues);
};

export const getSprints = async (projectId: string) => {
  return db.sprints.where("projectId").equals(projectId).toArray();
};

export const createSprint = async (projectId: string) => {
  const count = await db.sprints.where("projectId").equals(projectId).count();
  const newSprint: Sprint = {
    id: `s-${Date.now()}`,
    name: `Sprint ${count + 1}`,
    projectId,
    status: "future",
  };
  await db.sprints.add(newSprint);
  return newSprint;
};

export const updateSprintStatus = async (
  id: string,
  status: "active" | "future" | "completed",
) => {
  return db.sprints.update(id, { status });
};

export const getVersions = async (projectId: string) => {
  return db.projectVersions.where("projectId").equals(projectId).toArray();
};

export const createVersion = async (version: Partial<Version>) => {
  const newVersion = {
    id: `v-${Date.now()}`,
    status: "unreleased",
    ...version,
  } as Version;
  await db.projectVersions.add(newVersion);
  return newVersion;
};

export const getSavedFilters = async () => {
  return db.savedFilters.toArray();
};

export const saveFilter = async (name: string, query: string) => {
  const newFilter: SavedFilter = {
    id: `f-${Date.now()}`,
    name,
    query,
    ownerId: getCurrentUserId(),
    isFavorite: false,
  };
  await db.savedFilters.add(newFilter);
  return newFilter;
};

export const setupInitialProject = async (
  name: string,
  key: string,
  type: "Scrum" | "Kanban",
) => {
  const project = await createProject({ name, key, type });
  localStorage.setItem("hasSetup", "true");
  return project;
};

export const getProjectStats = async (pid: string) => {
  const issues = await db.issues.where("projectId").equals(pid).toArray();
  return buildProjectStats(issues, SEED_USERS);
};
