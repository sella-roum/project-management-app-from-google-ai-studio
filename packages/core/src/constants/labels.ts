import type { IssuePriority, IssueStatus, IssueType } from "../types";

export const STATUS_LABELS: Record<IssueStatus, string> = {
  "To Do": "未着手",
  "In Progress": "進行中",
  "In Review": "レビュー中",
  Done: "完了",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  Highest: "最高",
  High: "高",
  Medium: "中",
  Low: "低",
  Lowest: "最低",
};

export const TYPE_LABELS: Record<IssueType, string> = {
  Story: "ストーリー",
  Bug: "バグ",
  Task: "タスク",
  Epic: "エピック",
};

export const CATEGORY_LABELS: Record<string, string> = {
  Software: "ソフトウェア",
  Business: "ビジネス",
};
