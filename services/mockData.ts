

import { Dexie, Table } from 'dexie';
import { Issue, Project, User, Sprint, Notification, IssueStatus, IssuePriority, IssueType, Version, AutomationRule, SavedFilter, ViewHistory, WorkLog, AutomationLog, Attachment, LinkType } from '../types';

export const STATUS_LABELS: Record<IssueStatus, string> = {
  'To Do': '未着手',
  'In Progress': '進行中',
  'In Review': 'レビュー中',
  'Done': '完了'
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  'Highest': '最高',
  'High': '高',
  'Medium': '中',
  'Low': '低',
  'Lowest': '最低'
};

export const TYPE_LABELS: Record<IssueType, string> = {
  'Story': 'ストーリー',
  'Bug': 'バグ',
  'Task': 'タスク',
  'Epic': 'エピック'
};

export const CATEGORY_LABELS: Record<string, string> = {
  'Software': 'ソフトウェア',
  'Business': 'ビジネス'
};

export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  'To Do': ['In Progress', 'Done'],
  'In Progress': ['To Do', 'In Review', 'Done'],
  'In Review': ['In Progress', 'Done'],
  'Done': ['In Progress', 'To Do']
};

export const getCurrentUserId = () => localStorage.getItem('currentUserId') || '';

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
    super('JiraCloneDB');
    this.version(8).stores({
      users: 'id, &email',
      projects: 'id, key, type, leadId',
      issues: 'id, key, projectId, sprintId, assigneeId, reporterId, parentId, status, type',
      sprints: 'id, projectId, status',
      projectVersions: 'id, projectId',
      notifications: 'id, read, createdAt',
      automationRules: 'id, projectId, trigger, enabled',
      automationLogs: 'id, ruleId, executedAt',
      savedFilters: 'id',
      viewHistory: 'id, userId, viewedAt, [userId+issueId]'
    });
  }
}

export const db = new JiraCloneDB();

const SEED_USERS: (User & { email?: string })[] = [
  { id: 'u1', name: 'Alice Engineer', email: 'alice@example.com', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'u2', name: 'Bob Manager', email: 'bob@example.com', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
  { id: 'u3', name: 'Charlie Designer', email: 'charlie@example.com', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
];

export const USERS = SEED_USERS;

export const seedDatabase = async () => {
  await db.transaction('rw', [db.users, db.projects, db.issues, db.sprints, db.notifications, db.automationRules, db.automationLogs, db.savedFilters, db.viewHistory, db.projectVersions], async () => {
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

    const projectId = 'p-demo';
    await db.projects.add({
      id: projectId,
      key: 'DEMO',
      name: 'Jira Mobile Clone Dev',
      description: 'このアプリ自体の開発プロジェクトを模したデモデータです。',
      leadId: 'u1',
      category: 'Software',
      type: 'Scrum',
      iconUrl: '🚀',
      starred: true
    });

    const sprint1 = 's-1';
    await db.sprints.add({ id: sprint1, name: 'Sprint 1', projectId, status: 'active' });
    await db.sprints.add({ id: 's-backlog', name: 'バックログ', projectId, status: 'future' });

    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const issues: Issue[] = [
      {
        id: 'i-1', key: 'DEMO-1', projectId, title: 'ログイン画面の実装', type: 'Story', status: 'Done', priority: 'High',
        assigneeId: 'u1', reporterId: 'u2', sprintId: sprint1, labels: ['frontend'], 
        createdAt: yesterday, updatedAt: now, storyPoints: 5, watcherIds: ['u1'], comments: [], workLogs: [], history: [], links: [], attachments: []
      },
      {
        id: 'i-2', key: 'DEMO-2', projectId, title: 'APIのCORSエラー修正', type: 'Bug', status: 'In Progress', priority: 'Highest',
        assigneeId: 'u1', reporterId: 'u1', sprintId: sprint1, labels: ['backend', 'bug'], 
        createdAt: now, updatedAt: now, storyPoints: 3, watcherIds: ['u1', 'u2'], comments: [], workLogs: [], history: [], links: [], attachments: []
      },
      {
        id: 'i-3', key: 'DEMO-3', projectId, title: 'ダッシュボードのデザイン', type: 'Task', status: 'To Do', priority: 'Medium',
        assigneeId: 'u3', reporterId: 'u1', sprintId: sprint1, labels: ['design'], 
        createdAt: now, updatedAt: now, storyPoints: 2, watcherIds: [], comments: [], workLogs: [], history: [], links: [], attachments: []
      },
      {
        id: 'i-4', key: 'DEMO-4', projectId, title: 'ユーザー通知機能', type: 'Story', status: 'To Do', priority: 'High',
        assigneeId: 'u1', reporterId: 'u2', sprintId: sprint1, labels: ['feature'], 
        createdAt: now, updatedAt: now, storyPoints: 8, watcherIds: [], comments: [], workLogs: [], history: [], links: [], attachments: []
      },
      {
        id: 'i-5', key: 'DEMO-5', projectId, title: 'リリースマニュアルの作成', type: 'Task', status: 'To Do', priority: 'Low',
        assigneeId: undefined, reporterId: 'u1', sprintId: 's-backlog', labels: ['docs'], 
        createdAt: now, updatedAt: now, storyPoints: 1, watcherIds: [], comments: [], workLogs: [], history: [], links: [], attachments: []
      }
    ];

    await db.issues.bulkAdd(issues);
    
    await db.notifications.add({
      id: 'n-1', title: 'DEMO-2に割り当てられました', description: 'APIのCORSエラー修正',
      read: false, createdAt: now, type: 'assignment', issueId: 'i-2'
    });
  });
};

export const clearDatabase = async () => {
  await db.transaction('rw', [
    db.users, db.projects, db.issues, db.sprints, db.notifications, 
    db.automationRules, db.automationLogs, db.savedFilters, db.viewHistory, db.projectVersions
  ], async () => {
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
      db.projectVersions.clear()
    ]);
  });
};

export const checkIfDatabaseIsSeeded = async () => {
  const user = await db.users.get('u1');
  return !!user;
};

export const loginAsUser = async (email: string) => {
  const user = await db.users.where('email').equals(email).first();
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
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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
  const assigned = await db.issues.where('assigneeId').equals(uid).count();
  const reported = await db.issues.where('reporterId').equals(uid).count();
  const leading = await db.projects.where('leadId').equals(uid).count();
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
    category: 'Software',
    type: 'Kanban',
    starred: false,
    ...project
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

export const hasPermission = (userId: string, action: string, project?: Project) => {
  if (userId === 'u1') return true;
  // In demo mode, we allow all users to delete issues
  if (action === 'manage_project') return userId === 'u2'; 
  return true; 
};

const createNotification = async (notif: Partial<Notification>) => {
  await db.notifications.add({
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: notif.title || 'システム通知',
    description: notif.description || '',
    read: false,
    createdAt: new Date().toISOString(),
    type: notif.type || 'system',
    issueId: notif.issueId
  } as Notification);
};

export const getNotifications = async () => {
  return db.notifications.orderBy('createdAt').reverse().toArray();
};

export const getUnreadMentionCount = async () => {
  // Use filter because boolean fields in IndexedDB can sometimes be tricky with exact matches
  return db.notifications.filter(n => !n.read).count();
};

export const markNotificationRead = async (id: string) => {
  return db.notifications.update(id, { read: true });
};

export const markAllNotificationsRead = async () => {
  return db.notifications.toCollection().modify({ read: true });
};

const evaluateCondition = (condition: string, issue: Issue): boolean => {
  if (!condition) return true;
  const parts = condition.split(' ');
  if (parts.length === 3) {
    const [field, op, value] = parts;
    const actual = (issue as any)[field];
    if (op === '=') return String(actual) === value;
    if (op === '!=') return String(actual) !== value;
  }
  return true;
};

export const runAutomation = async (trigger: string, issue: Issue) => {
  const rules = await db.automationRules
    .where('projectId')
    .equals(issue.projectId)
    .filter(r => r.trigger === trigger && r.enabled)
    .toArray();

  for (const rule of rules) {
    if (!evaluateCondition(rule.condition, issue)) continue;

    try {
      if (rule.action === 'assign_reporter') {
        await updateIssue(issue.id, { assigneeId: issue.reporterId });
      } else if (rule.action === 'add_comment') {
        await addComment(issue.id, '自動化ルールによってシステムコメントが追加されました。');
      } else if (rule.action === 'set_priority_high') {
        await updateIssue(issue.id, { priority: 'High' });
      }

      await db.automationLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ruleId: rule.id,
        status: 'success',
        message: `ルール「${rule.name}」が実行されました。`,
        executedAt: new Date().toISOString()
      });
      await db.automationRules.update(rule.id, { lastRun: new Date().toISOString() });
    } catch (e) {
      console.error("Automation error:", e);
      await db.automationLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ruleId: rule.id,
        status: 'failure',
        message: `エラー: ${e instanceof Error ? e.message : String(e)}`,
        executedAt: new Date().toISOString()
      });
    }
  }
};

export const getAutomationRules = async (projectId: string) => {
  return db.automationRules.where('projectId').equals(projectId).toArray();
};

export const toggleAutomationRule = async (id: string, enabled: boolean) => {
  return db.automationRules.update(id, { enabled });
};

export const createAutomationRule = async (rule: Partial<AutomationRule>) => {
  const newRule = {
    id: `ar-${Date.now()}`,
    enabled: true,
    ...rule
  } as AutomationRule;
  await db.automationRules.add(newRule);
  return newRule;
};

export const getAutomationLogs = async (ruleId: string) => {
  const logs = await db.automationLogs.where('ruleId').equals(ruleId).toArray();
  return logs.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
};

export const getIssueById = async (id: string) => {
  return db.issues.get(id);
};

export const getIssues = async (projectId?: string) => {
  if (projectId) {
    return db.issues.where('projectId').equals(projectId).toArray();
  }
  return db.issues.toArray();
};

export const getIssuesForUser = async (userId: string) => {
  return db.issues.where('assigneeId').equals(userId).toArray();
};

export const createIssue = async (issue: Partial<Issue>) => {
  const project = await db.projects.get(issue.projectId!);
  const count = await db.issues.where('projectId').equals(issue.projectId!).count();
  const curUser = getCurrentUserId();
  const newIssue: Issue = {
    id: `i-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    key: `${project?.key}-${count + 101}`,
    projectId: issue.projectId!,
    title: issue.title || '無題',
    type: issue.type || 'Task',
    status: issue.status || 'To Do',
    priority: issue.priority || 'Medium',
    reporterId: curUser,
    assigneeId: issue.assigneeId,
    labels: [],
    comments: [],
    workLogs: [],
    history: [{
      id: `h-${Date.now()}`,
      authorId: curUser,
      field: 'status',
      from: null,
      to: issue.status || 'To Do',
      createdAt: new Date().toISOString()
    }],
    links: [],
    attachments: [],
    watcherIds: [curUser],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...issue
  } as Issue;
  
  await db.issues.add(newIssue);
  
  if (newIssue.assigneeId && newIssue.assigneeId !== curUser) {
    await createNotification({
      title: '新しい課題が割り当てられました',
      description: `${newIssue.key}: ${newIssue.title}`,
      type: 'assignment',
      issueId: newIssue.id
    });
  }

  await runAutomation('issue_created', newIssue);
  return newIssue;
};

export const updateIssue = async (id: string, updates: Partial<Issue>) => {
  const old = await db.issues.get(id);
  if (!old) return;
  const curUser = getCurrentUserId();

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
        createdAt: new Date().toISOString()
      });

      if (key === 'assigneeId' && value && value !== curUser) {
        await createNotification({
          title: '課題があなたに割り当てられました',
          description: `${old.key}: ${old.title}`,
          type: 'assignment',
          issueId: old.id
        });
      }

      if (key === 'status') {
        const watchers = old.watcherIds || [];
        for (const watcherId of watchers.filter(wid => wid !== curUser)) {
          await createNotification({
            title: `課題のステータスが「${STATUS_LABELS[value as IssueStatus]}」に変更されました`,
            description: old.key,
            type: 'system',
            issueId: old.id
          });
        }
      }
    }
  }

  const newHistory = [...(old.history || []), ...historyEntries];
  await db.issues.update(id, { ...changes, history: newHistory });
  
  const updated = await db.issues.get(id);
  if (updates.status && updates.status !== old.status && updated) {
    await runAutomation('status_changed', updated);
  }
  return updated;
};

export const updateIssueStatus = async (id: string, status: IssueStatus) => {
  return updateIssue(id, { status });
};

export const deleteIssue = async (id: string) => {
  const issue = await db.issues.get(id);
  if (issue && hasPermission(getCurrentUserId(), 'delete_issue')) {
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
        createdAt: new Date().toISOString()
      };
      const attachments = [...(issue.attachments || []), newAttachment];
      await db.issues.update(issueId, { attachments, updatedAt: new Date().toISOString() });
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
    const comments = [...(issue.comments || []), { 
      id: `c-${Date.now()}`, 
      authorId: curUser, 
      content: text, 
      createdAt: new Date().toISOString() 
    }];
    await db.issues.update(id, { comments, updatedAt: new Date().toISOString() });
    
    const watchers = issue.watcherIds || [];
    for (const watcherId of watchers.filter(wid => wid !== curUser)) {
      await createNotification({
        title: '新しいコメントが追加されました',
        description: `${issue.key}: ${text.substring(0, 30)}...`,
        type: 'mention',
        issueId: issue.id
      });
    }

    await runAutomation('comment_added', issue);
  }
};

export const getSubtasks = async (parentId: string) => {
  return db.issues.where('parentId').equals(parentId).toArray();
};

export const addIssueLink = async (issueId: string, targetId: string, type: LinkType) => {
  const issue = await db.issues.get(issueId);
  if (!issue) return;
  const links = [...(issue.links || []), { id: `l-${Date.now()}`, type, outwardIssueId: targetId }];
  return db.issues.update(issueId, { links });
};

export const logWork = async (issueId: string, seconds: number, comment?: string) => {
  const issue = await db.issues.get(issueId);
  if (!issue) return;
  const newLog: WorkLog = {
    id: `wl-${Date.now()}`,
    authorId: getCurrentUserId(),
    timeSpentSeconds: seconds,
    comment,
    createdAt: new Date().toISOString()
  };
  const workLogs = [...(issue.workLogs || []), newLog];
  return db.issues.update(issueId, { workLogs, updatedAt: new Date().toISOString() });
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
    viewedAt: new Date().toISOString()
  });
};

export const getRecentIssues = async () => {
  const curUser = getCurrentUserId();
  const history = await db.viewHistory
    .where('userId')
    .equals(curUser)
    .toArray();
  
  const recentHistory = history
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
    .slice(0, 10);
    
  const issueIds = recentHistory.map(h => h.issueId);
  if (issueIds.length === 0) return [];
  
  const issues = await db.issues.where('id').anyOf(issueIds).toArray();
  
  return issueIds.map(id => issues.find(i => i.id === id)).filter(Boolean) as Issue[];
};

export const getSprints = async (projectId: string) => {
  return db.sprints.where('projectId').equals(projectId).toArray();
};

export const createSprint = async (projectId: string) => {
  const count = await db.sprints.where('projectId').equals(projectId).count();
  const newSprint: Sprint = {
    id: `s-${Date.now()}`,
    name: `Sprint ${count + 1}`,
    projectId,
    status: 'future'
  };
  await db.sprints.add(newSprint);
  return newSprint;
};

export const updateSprintStatus = async (id: string, status: 'active' | 'future' | 'completed') => {
  return db.sprints.update(id, { status });
};

export const getVersions = async (projectId: string) => {
  return db.projectVersions.where('projectId').equals(projectId).toArray();
};

export const createVersion = async (version: Partial<Version>) => {
  const newVersion = {
    id: `v-${Date.now()}`,
    status: 'unreleased',
    ...version
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
    isFavorite: false
  };
  await db.savedFilters.add(newFilter);
  return newFilter;
};

export const executeJQL = (jql: string, issues: Issue[]): Issue[] => {
  try {
    const parts = jql.split(/ AND /i);
    return issues.filter(issue => {
      return parts.every(part => {
        const match = part.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
        if (!match) return true;
        const [_, field, val] = match;
        return String((issue as any)[field]) === val;
      });
    });
  } catch (e) {
    return issues;
  }
};

export const setupInitialProject = async (name: string, key: string, type: 'Scrum' | 'Kanban') => {
  const project = await createProject({ name, key, type });
  localStorage.setItem('hasSetup', 'true');
  return project;
};

export const getProjectStats = async (pid: string) => {
  const issues = await db.issues.where('projectId').equals(pid).toArray();
  const workload = SEED_USERS.map(u => ({ 
    userName: u.name, 
    count: issues.filter(i => i.assigneeId === u.id).length 
  }));

  const epics = issues.filter(i => i.type === 'Epic');
  const epicProgress = epics.map(epic => {
    const children = issues.filter(i => i.parentId === epic.id);
    const doneCount = children.filter(i => i.status === 'Done').length;
    const percent = children.length > 0 ? Math.round((doneCount / children.length) * 100) : 0;
    return { id: epic.id, title: epic.title, percent };
  });

  return { workload, epicProgress };
};