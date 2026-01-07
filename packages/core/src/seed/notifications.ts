import type { Notification } from "../types";

export const getSeedNotifications = (nowIso: string): Notification[] => [
  {
    id: "n-1",
    title: "DEMO-2に割り当てられました",
    description: "APIのCORSエラー修正",
    read: false,
    createdAt: nowIso,
    type: "assignment",
    issueId: "i-2",
  },
];
