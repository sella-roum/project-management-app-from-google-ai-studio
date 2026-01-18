import { getSeedUsers } from "@repo/core";

import { SQLiteStorageAdapter } from "./sqliteStorageAdapter";

export { SQLiteStorageAdapter };

export const USERS = getSeedUsers();

export const createMobileStorage = () => new SQLiteStorageAdapter();

export const storage = new SQLiteStorageAdapter();

export const seedDatabase = () => storage.seedDemo();
export const clearDatabase = () => storage.clearDatabase();
export const checkIfDatabaseIsSeeded = () => storage.checkIfDatabaseIsSeeded();
export const reset = () => storage.reset();
export const getCurrentUserId = () => storage.getCurrentUserId();
export const loginAsUser = (email: string) => storage.loginAsUser(email);
export const registerUser = (email: string, name: string) =>
  storage.registerUser(email, name);
export const getUsers = () => storage.getUsers();
export const getUserById = (id: string) => storage.getUserById(id);
export const getCurrentUser = () => storage.getCurrentUser();
export const updateUser = (
  id: string,
  updates: Parameters<typeof storage.updateUser>[1],
) => storage.updateUser(id, updates);
export const getUserStats = (uid: string) => storage.getUserStats(uid);
export const getProjects = () => storage.getProjects();
export const getProjectById = (id: string) => storage.getProjectById(id);
export const createProject = (
  project: Parameters<typeof storage.createProject>[0],
) => storage.createProject(project);
export const updateProject = (
  id: string,
  updates: Parameters<typeof storage.updateProject>[1],
) => storage.updateProject(id, updates);
export const deleteProject = (id: string) => storage.deleteProject(id);
export const toggleProjectStar = (id: string) => storage.projects.toggleStar(id);
export const hasPermission = (
  userId: string,
  action: string,
  project?: Parameters<typeof storage.hasPermission>[2],
) => storage.hasPermission(userId, action, project);
export const getNotifications = () => storage.getNotifications();
export const getUnreadMentionCount = () => storage.getUnreadMentionCount();
export const markNotificationRead = (id: string) =>
  storage.markNotificationRead(id);
export const markAllNotificationsRead = () => storage.markAllNotificationsRead();
export const runAutomation = (
  trigger: string,
  issue: Parameters<typeof storage.runAutomation>[1],
) => storage.runAutomation(trigger, issue);
export const getAutomationRules = (projectId: string) =>
  storage.getAutomationRules(projectId);
export const toggleAutomationRule = (id: string, enabled: boolean) =>
  storage.toggleAutomationRule(id, enabled);
export const createAutomationRule = (
  rule: Parameters<typeof storage.createAutomationRule>[0],
) => storage.createAutomationRule(rule);
export const updateAutomationRule = (
  id: string,
  patch: Parameters<typeof storage.updateAutomationRule>[1],
) => storage.updateAutomationRule(id, patch);
export const getAutomationLogs = (ruleId: string) =>
  storage.getAutomationLogs(ruleId);
export const getIssueById = (id: string) => storage.getIssueById(id);
export const getIssues = (projectId?: string) => storage.getIssues(projectId);
export const getIssuesForUser = (userId: string) =>
  storage.getIssuesForUser(userId);
export const createIssue = (issue: Parameters<typeof storage.createIssue>[0]) =>
  storage.createIssue(issue);
export const updateIssue = (
  id: string,
  updates: Parameters<typeof storage.updateIssue>[1],
) => storage.updateIssue(id, updates);
export const updateIssueStatus = (
  id: string,
  status: Parameters<typeof storage.updateIssueStatus>[1],
) => storage.updateIssueStatus(id, status);
export const deleteIssue = (id: string) => storage.deleteIssue(id);
export const addAttachment = (
  issueId: string,
  file: Parameters<typeof storage.addAttachment>[1],
) => storage.addAttachment(issueId, file);
export const addComment = (id: string, text: string) =>
  storage.addComment(id, text);
export const getSubtasks = (parentId: string) => storage.getSubtasks(parentId);
export const addIssueLink = (
  issueId: string,
  targetId: string,
  type: Parameters<typeof storage.addIssueLink>[2],
) => storage.addIssueLink(issueId, targetId, type);
export const logWork = (issueId: string, seconds: number, comment?: string) =>
  storage.logWork(issueId, seconds, comment);
export const toggleWatch = (issueId: string) => storage.toggleWatch(issueId);
export const recordView = (issueId: string) => storage.recordView(issueId);
export const getRecentIssues = () => storage.getRecentIssues();
export const getSprints = (projectId: string) => storage.getSprints(projectId);
export const createSprint = (projectId: string) => storage.createSprint(projectId);
export const updateSprintStatus = (
  id: string,
  status: Parameters<typeof storage.updateSprintStatus>[1],
) => storage.updateSprintStatus(id, status);
export const getVersions = (projectId: string) => storage.getVersions(projectId);
export const createVersion = (
  version: Parameters<typeof storage.createVersion>[0],
) => storage.createVersion(version);
export const updateVersion = (
  id: string,
  patch: Parameters<typeof storage.updateVersion>[1],
) => storage.updateVersion(id, patch);
export const deleteVersion = (id: string) => storage.deleteVersion(id);
export const getSavedFilters = (ownerId?: string) =>
  storage.getSavedFilters(ownerId);
export const saveFilter = (
  name: string,
  query: string,
  ownerId?: string,
  isJqlMode?: boolean,
) => storage.saveFilter(name, query, ownerId, isJqlMode);
export const updateSavedFilter = (
  id: string,
  patch: Parameters<typeof storage.updateSavedFilter>[1],
) => storage.updateSavedFilter(id, patch);
export const deleteSavedFilter = (id: string) => storage.deleteSavedFilter(id);
export const setupInitialProject = (
  name: string,
  key: string,
  type: Parameters<typeof storage.setupInitialProject>[2],
) => storage.setupInitialProject(name, key, type);
export const getProjectStats = (pid: string) => storage.getProjectStats(pid);
