import type {
  AutomationRule,
  Issue,
  Notification,
  Project,
  SavedFilter,
  Sprint,
  Version,
} from "@repo/core";

export type ID = string;
export type Unsubscribe = () => void;

export interface Watchable<T> {
  watchAll(listener: (rows: T[]) => void): Promise<Unsubscribe>;
  watchById(id: ID, listener: (row: T | null) => void): Promise<Unsubscribe>;
}

export interface ProjectsRepo extends Watchable<Project> {
  list(): Promise<Project[]>;
  get(id: ID): Promise<Project | null>;
  create(input: Partial<Project> & { id?: ID }): Promise<Project>;
  update(id: ID, patch: Partial<Project>): Promise<Project>;
  toggleStar(id: ID): Promise<void>;
  remove(id: ID): Promise<void>;
}

export interface IssuesRepo extends Watchable<Issue> {
  listByProject(projectId: ID): Promise<Issue[]>;
  create(
    input: Partial<Issue> & { projectId: ID; title: string },
  ): Promise<Issue>;
  update(id: ID, patch: Partial<Issue>): Promise<Issue | false | undefined>;
  updateStatus(id: ID, status: Issue["status"]): Promise<void>;
  remove(id: ID): Promise<void>;
}

export interface SprintsRepo extends Watchable<Sprint> {
  listByProject(projectId: ID): Promise<Sprint[]>;
  create(
    input: Partial<Sprint> & { projectId: ID; name: string },
  ): Promise<Sprint>;
  start(id: ID): Promise<void>;
  complete(id: ID): Promise<void>;
}

export interface NotificationsRepo extends Watchable<Notification> {
  markRead(id: ID): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface SettingsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  multiRemove(keys: string[]): Promise<void>;
}

export interface AppStorage {
  projects: ProjectsRepo;
  issues: IssuesRepo;
  sprints: SprintsRepo;
  notifications: NotificationsRepo;
  settings: SettingsStore;

  seedDemo(): Promise<void>;
  reset(): Promise<void>;
}

export interface VersionsRepo extends Watchable<Version> {
  listByProject(projectId: ID): Promise<Version[]>;
  create(
    input: Partial<Version> & { projectId: ID; name: string },
  ): Promise<Version>;
  update(id: ID, patch: Partial<Version>): Promise<Version>;
  remove(id: ID): Promise<void>;
}

export interface AutomationRulesRepo extends Watchable<AutomationRule> {
  listByProject(projectId: ID): Promise<AutomationRule[]>;
  create(
    input: Partial<AutomationRule> & { projectId: ID; name: string },
  ): Promise<AutomationRule>;
  update(id: ID, patch: Partial<AutomationRule>): Promise<AutomationRule>;
  toggleEnabled(id: ID, enabled: boolean): Promise<void>;
  remove(id: ID): Promise<void>;
}

export interface SavedFiltersRepo extends Watchable<SavedFilter> {
  listByOwner(ownerId: ID): Promise<SavedFilter[]>;
  create(
    input: Partial<SavedFilter> & { ownerId: ID; name: string },
  ): Promise<SavedFilter>;
  update(id: ID, patch: Partial<SavedFilter>): Promise<SavedFilter>;
  remove(id: ID): Promise<void>;
}
