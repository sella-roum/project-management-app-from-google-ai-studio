import {
  DEFAULT_NOTIFICATION_SCHEME,
  WORKFLOW_TRANSITIONS,
} from "../constants";
import type { Project } from "../types";

export const getSeedProjects = (): Project[] => [
  {
    id: "p-demo",
    key: "DEMO",
    name: "Jira Mobile Clone Dev",
    description: "このアプリ自体の開発プロジェクトを模したデモデータです。",
    leadId: "u1",
    category: "Software",
    type: "Scrum",
    iconUrl: "🚀",
    starred: true,
    workflowSettings: WORKFLOW_TRANSITIONS,
    notificationSettings: DEFAULT_NOTIFICATION_SCHEME,
  },
];
