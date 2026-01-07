export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type: "mention" | "assignment" | "system";
  issueId?: string;
}
