import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import {
  CATEGORY_LABELS,
  DEFAULT_NOTIFICATION_SCHEME,
  STATUS_LABELS,
  WORKFLOW_TRANSITIONS,
} from "@repo/core";
import type {
  AutomationLog,
  AutomationRule,
  Issue,
  IssueStatus,
  ProjectStats,
  Project,
  Sprint,
  Version,
} from "@repo/core";
import {
  createAutomationRule,
  createIssue,
  createVersion,
  deleteProject,
  getAutomationRules,
  getAutomationLogs,
  getCurrentUserId,
  getIssues,
  getProjectById,
  getProjectStats,
  getSprints,
  getVersions,
  recordView,
  updateIssue,
  toggleAutomationRule,
  updateAutomationRule,
  updateIssueStatus,
  updateProject,
  updateSprintStatus,
  createSprint,
  USERS,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FloatingActionButton } from "@/components/floating-action-button";
import { useStorageReady } from "@/hooks/use-storage";

const TABS = [
  "Summary",
  "Board",
  "Backlog",
  "Timeline",
  "Releases",
  "Automation",
  "Settings",
] as const;

const BOARD_STATUSES: IssueStatus[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];

export default function ProjectViewScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const normalizedProjectId = useMemo(
    () => (Array.isArray(projectId) ? projectId[0] : projectId),
    [projectId],
  );
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [boardSwimlane, setBoardSwimlane] = useState<
    "none" | "assignee"
  >("none");
  const [boardFilters, setBoardFilters] = useState<("mine" | "recent")[]>([]);
  const [inlineCreateStatus, setInlineCreateStatus] = useState<IssueStatus | null>(
    null,
  );
  const [inlineCreateTitle, setInlineCreateTitle] = useState("");
  const [activeMoveIssueId, setActiveMoveIssueId] = useState<string | null>(null);
  const [boardOrder, setBoardOrder] = useState<Record<IssueStatus, string[]>>(
    () => ({
      "To Do": [],
      "In Progress": [],
      "In Review": [],
      Done: [],
    }),
  );
  const [sprintOrder, setSprintOrder] = useState<Record<string, string[]>>({});
  const [inlineSprintId, setInlineSprintId] = useState<string | null>(null);
  const [inlineSprintTitle, setInlineSprintTitle] = useState("");
  const [completeSprint, setCompleteSprint] = useState<Sprint | null>(null);
  const [completeDestination, setCompleteDestination] = useState<
    "backlog" | "next"
  >("backlog");
  const [moveSprintIssueId, setMoveSprintIssueId] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<
    "week" | "month" | "quarter"
  >("month");
  const [dueDateDrafts, setDueDateDrafts] = useState<Record<string, string>>(
    {},
  );
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectCategory, setProjectCategory] = useState<
    Project["category"] | ""
  >("");
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDate, setNewVersionDate] = useState("");
  const [workflowSettings, setWorkflowSettings] = useState<
    Record<string, string[]>
  >({});
  const [notificationSettings, setNotificationSettings] = useState<
    Record<string, string[]>
  >({});
  const [settingsTab, setSettingsTab] = useState<
    "details" | "workflow" | "permissions" | "notifications"
  >("details");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showNotificationEditor, setShowNotificationEditor] = useState(false);
  const [workflowDraft, setWorkflowDraft] = useState<Record<string, string[]>>(
    {},
  );
  const [notificationDraft, setNotificationDraft] = useState<
    Record<string, string[]>
  >({});
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [automationTab, setAutomationTab] = useState<"rules" | "logs">("rules");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] =
    useState<AutomationRule["trigger"]>("issue_created");
  const [ruleAction, setRuleAction] =
    useState<AutomationRule["action"]>("assign_reporter");

  const triggerLabelMap: Record<AutomationRule["trigger"], string> = {
    issue_created: "課題の作成時",
    status_changed: "ステータス変更時",
    comment_added: "コメント投稿時",
  };

  const actionLabelMap: Record<AutomationRule["action"], string> = {
    assign_reporter: "報告者に割り当て",
    add_comment: "コメントを自動投稿",
    set_priority_high: "優先度を「高」にする",
  };

  const reload = useCallback(async () => {
    if (!normalizedProjectId) return;
    const [projectData, issueData, sprintData, versionData, ruleData, statsData] =
      await Promise.all([
        getProjectById(normalizedProjectId),
        getIssues(normalizedProjectId),
        getSprints(normalizedProjectId),
        getVersions(normalizedProjectId),
        getAutomationRules(normalizedProjectId),
        getProjectStats(normalizedProjectId),
      ]);
    setProject(projectData);
    setIssues(issueData);
    setSprints(sprintData);
    setVersions(versionData);
    setAutomationRules(ruleData.map((rule) => rule));
    setStats(statsData);
    setProjectName(projectData?.name ?? "");
    setProjectKey(projectData?.key ?? "");
    setProjectDescription(projectData?.description ?? "");
    setProjectCategory(projectData?.category ?? "");
    const workflow =
      projectData?.workflowSettings ?? WORKFLOW_TRANSITIONS;
    const notifications =
      projectData?.notificationSettings ?? DEFAULT_NOTIFICATION_SCHEME;
    setWorkflowSettings(
      Object.fromEntries(
        Object.entries(workflow).map(([status, next]) => [status, [...next]]),
      ),
    );
    setWorkflowDraft(
      Object.fromEntries(
        Object.entries(workflow).map(([status, next]) => [status, [...next]]),
      ),
    );
    setNotificationSettings(
      Object.fromEntries(
        Object.entries(notifications).map(([event, recipients]) => [
          event,
          [...recipients],
        ]),
      ),
    );
    setNotificationDraft(
      Object.fromEntries(
        Object.entries(notifications).map(([event, recipients]) => [
          event,
          [...recipients],
        ]),
      ),
    );
  }, [normalizedProjectId]);

  useEffect(() => {
    if (!ready || !normalizedProjectId) return;
    void reload();
  }, [ready, normalizedProjectId, reload]);

  useEffect(() => {
    if (!selectedRuleId) {
      setAutomationLogs([]);
      return;
    }
    const loadLogs = async () => {
      const logs = await getAutomationLogs(selectedRuleId);
      setAutomationLogs(logs);
    };
    void loadLogs();
  }, [selectedRuleId]);

  useEffect(() => {
    setDueDateDrafts((prev) => {
      const next = { ...prev };
      issues.forEach((issue) => {
        const value = issue.dueDate ? issue.dueDate.slice(0, 10) : "";
        if (next[issue.id] !== value) {
          next[issue.id] = value;
        }
      });
      return next;
    });
  }, [issues]);

  useEffect(() => {
    if (!issues.length) return;
    setBoardOrder((prev) => {
      const next: Record<IssueStatus, string[]> = { ...prev };
      BOARD_STATUSES.forEach((status) => {
        const ids = issues.filter((issue) => issue.status === status).map((issue) => issue.id);
        const ordered = (next[status] ?? []).filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !ordered.includes(id));
        next[status] = [...ordered, ...missing];
      });
      return next;
    });
    setSprintOrder((prev) => {
      const next = { ...prev };
      sprints.forEach((sprint) => {
        const ids = issues
          .filter((issue) =>
            sprint.name.includes("バックログ")
              ? !issue.sprintId || issue.sprintId === sprint.id
              : issue.sprintId === sprint.id,
          )
          .map((issue) => issue.id);
        const ordered = (next[sprint.id] ?? []).filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !ordered.includes(id));
        next[sprint.id] = [...ordered, ...missing];
      });
      return next;
    });
  }, [issues, sprints]);

  const handleSaveDetails = async () => {
    if (!normalizedProjectId) return;
    await updateProject(normalizedProjectId, {
      name: projectName,
      description: projectDescription,
      category: projectCategory || project?.category || "Software",
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    await reload();
  };

  const handleDeleteProject = async () => {
    if (!normalizedProjectId) return;
    Alert.alert(
      "プロジェクトを削除",
      `プロジェクト「${project?.name ?? ""}」を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            await deleteProject(normalizedProjectId);
            router.replace("/(tabs)/projects");
          },
        },
      ],
    );
  };

  const handleCreateVersion = async () => {
    if (!normalizedProjectId || !newVersionName) return;
    if (newVersionDate) {
      const parsedDate = new Date(newVersionDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert("日付形式エラー", "YYYY-MM-DD 形式で入力してください。");
        return;
      }
    }
    await createVersion({
      projectId: normalizedProjectId,
      name: newVersionName,
      releaseDate: newVersionDate || undefined,
    });
    setNewVersionName("");
    setNewVersionDate("");
    await reload();
  };

  const handleSaveWorkflow = async () => {
    if (!normalizedProjectId) return;
    await updateProject(normalizedProjectId, {
      workflowSettings: workflowDraft,
    });
    setWorkflowSettings(workflowDraft);
    setShowWorkflowEditor(false);
    await reload();
  };

  const handleSaveNotifications = async () => {
    if (!normalizedProjectId) return;
    await updateProject(normalizedProjectId, {
      notificationSettings: notificationDraft,
    });
    setNotificationSettings(notificationDraft);
    setShowNotificationEditor(false);
    await reload();
  };

  const toggleWorkflowTransition = (status: IssueStatus, next: IssueStatus) => {
    setWorkflowDraft((prev) => {
      const current = new Set(prev[status] ?? []);
      if (current.has(next)) {
        current.delete(next);
      } else {
        current.add(next);
      }
      return { ...prev, [status]: Array.from(current) };
    });
  };

  const toggleNotificationRecipient = (eventKey: string, recipient: string) => {
    setNotificationDraft((prev) => {
      const current = new Set(prev[eventKey] ?? []);
      if (current.has(recipient)) {
        current.delete(recipient);
      } else {
        current.add(recipient);
      }
      return { ...prev, [eventKey]: Array.from(current) };
    });
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    await toggleAutomationRule(ruleId, !enabled);
    await reload();
  };

  const resetAutomationForm = () => {
    setRuleName("");
    setRuleTrigger("issue_created");
    setRuleAction("assign_reporter");
    setEditingRule(null);
  };

  const handleStartCreateRule = () => {
    resetAutomationForm();
    setShowAutomationForm(true);
  };

  const handleStartEditRule = (rule: AutomationRule) => {
    setRuleName(rule.name);
    setRuleTrigger(rule.trigger);
    setRuleAction(rule.action);
    setEditingRule(rule);
    setShowAutomationForm(true);
  };

  const handleSaveAutomationRule = async () => {
    if (!normalizedProjectId || !ruleName.trim()) return;
    if (editingRule) {
      await updateAutomationRule(editingRule.id, {
        name: ruleName.trim(),
        trigger: ruleTrigger,
        action: ruleAction,
      });
    } else {
      await createAutomationRule({
        projectId: normalizedProjectId,
        name: ruleName.trim(),
        trigger: ruleTrigger,
        action: ruleAction,
        enabled: true,
      });
    }
    setShowAutomationForm(false);
    resetAutomationForm();
    await reload();
  };

  const handleOpenIssue = async (issueId: string) => {
    await recordView(issueId);
    router.push(`/issue/${issueId}`);
  };

  const toggleBoardFilter = (filter: "mine" | "recent") => {
    setBoardFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter],
    );
  };

  const handleInlineCreate = async (status: IssueStatus) => {
    if (!normalizedProjectId || !inlineCreateTitle.trim()) return;
    await createIssue({
      projectId: normalizedProjectId,
      title: inlineCreateTitle.trim(),
      status,
      type: "Task",
    });
    setInlineCreateTitle("");
    setInlineCreateStatus(null);
    await reload();
  };

  const handleMoveIssue = async (issueId: string, status: IssueStatus) => {
    const result = await updateIssueStatus(issueId, status);
    if (!result) {
      Alert.alert("ステータス変更不可", "この遷移は許可されていません。");
      return;
    }
    setActiveMoveIssueId(null);
    await reload();
  };

  const handleCreateSprint = async () => {
    if (!normalizedProjectId) return;
    await createSprint(normalizedProjectId);
    await reload();
  };

  const handleStartSprint = async (sprintId: string) => {
    await updateSprintStatus(sprintId, "active");
    await reload();
  };

  const handleCompleteSprint = (sprint: Sprint) => {
    setCompleteSprint(sprint);
    setCompleteDestination("backlog");
  };

  const handleApplyCompleteSprint = async () => {
    if (!completeSprint || !normalizedProjectId) return;
    const incomplete = issues.filter(
      (issue) => issue.sprintId === completeSprint.id && issue.status !== "Done",
    );
    let targetSprintId: string | undefined;
    if (completeDestination === "next") {
      const newSprint = await createSprint(normalizedProjectId);
      targetSprintId = newSprint.id;
    }
    for (const issue of incomplete) {
      await updateIssue(issue.id, { sprintId: targetSprintId });
    }
    await updateSprintStatus(completeSprint.id, "completed");
    setCompleteSprint(null);
    await reload();
  };

  const handleInlineSprintCreate = async (sprintId?: string) => {
    if (!normalizedProjectId || !inlineSprintTitle.trim()) return;
    await createIssue({
      projectId: normalizedProjectId,
      title: inlineSprintTitle.trim(),
      sprintId,
      status: "To Do",
      type: "Task",
    });
    setInlineSprintTitle("");
    setInlineSprintId(null);
    await reload();
  };

  const handleMoveIssueToSprint = async (
    issueId: string,
    sprintId?: string,
  ) => {
    await updateIssue(issueId, { sprintId });
    setMoveSprintIssueId(null);
    await reload();
  };

  const handleDueDateChange = (issueId: string, value: string) => {
    setDueDateDrafts((prev) => ({ ...prev, [issueId]: value }));
  };

  const handleDueDateSave = async (issue: Issue) => {
    const value = dueDateDrafts[issue.id] ?? "";
    if (!value) {
      await updateIssue(issue.id, { dueDate: undefined });
      await reload();
      return;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      Alert.alert("日付形式エラー", "YYYY-MM-DD 形式で入力してください。");
      return;
    }
    await updateIssue(issue.id, { dueDate: date.toISOString() });
    await reload();
  };

  const moveInOrder = (
    order: string[],
    issueId: string,
    direction: "up" | "down",
  ) => {
    const index = order.indexOf(issueId);
    if (index === -1) return order;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= order.length) return order;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    return next;
  };

  const moveIssueInBoard = (
    status: IssueStatus,
    issueId: string,
    direction: "up" | "down",
  ) => {
    setBoardOrder((prev) => ({
      ...prev,
      [status]: moveInOrder(prev[status] ?? [], issueId, direction),
    }));
  };

  const moveIssueInSprint = (
    sprintId: string,
    issueId: string,
    direction: "up" | "down",
  ) => {
    setSprintOrder((prev) => ({
      ...prev,
      [sprintId]: moveInOrder(prev[sprintId] ?? [], issueId, direction),
    }));
  };

  const currentUserId = getCurrentUserId();

  const filteredIssues = useMemo(() => {
    let result = [...issues];
    if (boardFilters.includes("mine")) {
      result = result.filter((issue) => issue.assigneeId === currentUserId);
    }
    if (boardFilters.includes("recent")) {
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      result = result.filter((issue) => issue.updatedAt > dayAgo);
    }
    return result;
  }, [issues, boardFilters, currentUserId]);

  const swimlanes = useMemo(() => {
    if (boardSwimlane === "none") {
      return [{ id: "all", name: "すべての課題" }];
    }
    const assigneeIds = new Set(
      filteredIssues.map((issue) => issue.assigneeId).filter(Boolean),
    );
    const activeUsers = USERS.filter((user) => assigneeIds.has(user.id));
    return [
      ...activeUsers.map((user) => ({ id: user.id, name: user.name })),
      { id: "unassigned", name: "未割り当て" },
    ];
  }, [boardSwimlane, filteredIssues]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_LABELS).forEach((status) => {
      counts[status] = 0;
    });
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const activeSprints = useMemo(
    () => sprints.filter((sprint) => sprint.status === "active"),
    [sprints],
  );
  const futureSprints = useMemo(
    () =>
      sprints.filter(
        (sprint) =>
          sprint.status === "future" && !sprint.name.includes("バックログ"),
      ),
    [sprints],
  );
  const backlogSprint = useMemo(() => {
    const existing = sprints.find((sprint) =>
      sprint.name.includes("バックログ"),
    );
    if (existing) return existing;
    return {
      id: "backlog",
      name: "バックログ",
      status: "future",
      projectId: normalizedProjectId ?? "",
    } as Sprint;
  }, [sprints, normalizedProjectId]);

  const timelineConfig = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timelineZoom === "week") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 28);
    } else if (timelineZoom === "quarter") {
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 9, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    }

    const totalDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    return { start, end, totalDays };
  }, [timelineZoom]);

  const notificationLabels = useMemo(
    () => ({
      issue_created: "課題の作成",
      issue_updated: "課題の更新",
      issue_assigned: "課題の割り当て",
      comment_added: "コメント投稿",
      issue_resolved: "課題の解決",
    }),
    [],
  );
  const workflowStatusOptions = useMemo(
    () => Object.keys(STATUS_LABELS) as IssueStatus[],
    [],
  );
  const notificationRecipients = ["Reporter", "Assignee", "Watcher"];

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Project</ThemedText>
        {!ready ? (
          <ThemedText>Loading project...</ThemedText>
        ) : project ? (
          <>
            <ThemedText type="subtitle">{project.name}</ThemedText>
            <ThemedText>{project.key}</ThemedText>
            <Link
              href={{
                pathname: "/modal",
                params: { mode: "issue", projectId: project.id },
              }}
            >
              <ThemedText type="link">Create issue</ThemedText>
            </Link>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ThemedView style={styles.tabRow}>
                {TABS.map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                  >
                    <ThemedText>{tab}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            </ScrollView>

          {activeTab === "Summary" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.statsRow}>
                <ThemedView style={styles.statCard}>
                  <ThemedText type="defaultSemiBold">
                    {issues.filter((i) => i.status !== "Done").length}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>未完了</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statCard}>
                  <ThemedText type="defaultSemiBold">
                    {statusCounts["Done"] || 0}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>完了</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.card}>
                <ThemedText type="subtitle">サマリー</ThemedText>
                <ThemedText>{issues.length} issues</ThemedText>
                <ThemedText>{versions.length} versions</ThemedText>
              </ThemedView>
              {stats && stats.workload.length > 0 ? (
                <ThemedView style={styles.card}>
                  <ThemedText type="subtitle">ワークロード</ThemedText>
                  {stats.workload.map((item) => (
                    <ThemedView key={item.userName} style={styles.rowBetween}>
                      <ThemedText>{item.userName}</ThemedText>
                      <ThemedText>{item.count}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}
              {stats && stats.epicProgress.length > 0 ? (
                <ThemedView style={styles.card}>
                  <ThemedText type="subtitle">エピック進捗</ThemedText>
                  {stats.epicProgress.map((epic) => (
                    <ThemedView key={epic.id} style={styles.rowBetween}>
                      <ThemedText numberOfLines={1}>{epic.title}</ThemedText>
                      <ThemedText>{epic.percent}%</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}
              <ThemedView style={styles.card}>
                <ThemedText type="subtitle">ステータス合計</ThemedText>
                {Object.keys(STATUS_LABELS).map((status) => (
                  <ThemedView key={status} style={styles.rowBetween}>
                    <ThemedText>{STATUS_LABELS[status]}</ThemedText>
                    <ThemedText>{statusCounts[status] || 0}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          ) : null}

          {activeTab === "Board" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.boardControls}>
                <ThemedView style={styles.row}>
                  <Pressable
                    onPress={() => setBoardSwimlane("none")}
                    style={[
                      styles.boardToggle,
                      boardSwimlane === "none" && styles.boardToggleActive,
                    ]}
                  >
                    <ThemedText>スタンダード</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setBoardSwimlane("assignee")}
                    style={[
                      styles.boardToggle,
                      boardSwimlane === "assignee" && styles.boardToggleActive,
                    ]}
                  >
                    <ThemedText>担当者別</ThemedText>
                  </Pressable>
                </ThemedView>
                <ThemedView style={styles.rowWrap}>
                  <Pressable
                    onPress={() => toggleBoardFilter("mine")}
                    style={[
                      styles.filterChip,
                      boardFilters.includes("mine") && styles.filterChipActive,
                    ]}
                  >
                    <ThemedText>自分の課題</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleBoardFilter("recent")}
                    style={[
                      styles.filterChip,
                      boardFilters.includes("recent") && styles.filterChipActive,
                    ]}
                  >
                    <ThemedText>最近更新</ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
              {BOARD_STATUSES.map((status) => {
                const columnIssues = filteredIssues.filter(
                  (issue) => issue.status === status,
                );
                const order = boardOrder[status] ?? [];
                const orderedIssues = [...columnIssues].sort(
                  (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
                );
                const limit = project?.columnSettings?.[status]?.limit;
                const isOverLimit = Boolean(limit && columnIssues.length > limit);

                const renderIssue = (issue: Issue) => {
                  const assigneeName =
                    USERS.find((user) => user.id === issue.assigneeId)?.name ||
                    "未割り当て";
                  const allowed = workflowSettings[issue.status] ?? [];
                  return (
                    <ThemedView key={issue.id} style={styles.issueCard}>
                      <Pressable
                        onPress={() => handleOpenIssue(issue.id)}
                        style={styles.issueRow}
                      >
                        <ThemedText type="defaultSemiBold">
                          {issue.key}
                        </ThemedText>
                        <ThemedText>{issue.title}</ThemedText>
                      </Pressable>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText style={styles.metaText}>
                          {assigneeName}
                        </ThemedText>
                        <ThemedView style={styles.row}>
                          <Pressable
                            onPress={() => moveIssueInBoard(status, issue.id, "up")}
                            style={styles.ghostBtnSmall}
                          >
                            <ThemedText>↑</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => moveIssueInBoard(status, issue.id, "down")}
                            style={styles.ghostBtnSmall}
                          >
                            <ThemedText>↓</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              setActiveMoveIssueId(
                                activeMoveIssueId === issue.id
                                  ? null
                                  : issue.id,
                              )
                            }
                            style={styles.ghostBtnSmall}
                          >
                            <ThemedText>移動</ThemedText>
                          </Pressable>
                        </ThemedView>
                      </ThemedView>
                      {activeMoveIssueId === issue.id && allowed.length > 0 ? (
                        <ThemedView style={styles.rowWrap}>
                          {allowed.map((next) => (
                            <Pressable
                              key={next}
                              onPress={() => handleMoveIssue(issue.id, next)}
                              style={styles.actionChip}
                            >
                              <ThemedText>{STATUS_LABELS[next]}</ThemedText>
                            </Pressable>
                          ))}
                        </ThemedView>
                      ) : null}
                    </ThemedView>
                  );
                };

                return (
                  <ThemedView key={status} style={styles.card}>
                    <ThemedView style={styles.rowBetween}>
                      <ThemedText type="defaultSemiBold">
                        {STATUS_LABELS[status]}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.metaText,
                          isOverLimit && styles.overLimitText,
                        ]}
                      >
                        {columnIssues.length}
                        {limit ? ` / ${limit}` : ""}
                      </ThemedText>
                    </ThemedView>

                    {boardSwimlane === "assignee" ? (
                      swimlanes.map((lane) => {
                        const laneIssues =
                          lane.id === "unassigned"
                            ? orderedIssues.filter((i) => !i.assigneeId)
                            : lane.id === "all"
                              ? orderedIssues
                              : orderedIssues.filter(
                                  (i) => i.assigneeId === lane.id,
                                );
                        if (laneIssues.length === 0) return null;
                        return (
                          <ThemedView
                            key={`${status}-${lane.id}`}
                            style={styles.section}
                          >
                            <ThemedText style={styles.metaText}>
                              {lane.name} ({laneIssues.length})
                            </ThemedText>
                            {laneIssues.map(renderIssue)}
                          </ThemedView>
                        );
                      })
                    ) : orderedIssues.length === 0 ? (
                      <ThemedText style={styles.metaText}>
                        課題はありません。
                      </ThemedText>
                    ) : (
                      orderedIssues.map(renderIssue)
                    )}

                    {status === "To Do" ? (
                      inlineCreateStatus === status ? (
                        <ThemedView style={styles.inlineCreate}>
                          <TextInput
                            style={styles.input}
                            placeholder="課題タイトル"
                            value={inlineCreateTitle}
                            onChangeText={setInlineCreateTitle}
                          />
                          <ThemedView style={styles.row}>
                            <Pressable
                              onPress={() => handleInlineCreate(status)}
                              style={styles.primaryBtn}
                            >
                              <ThemedText type="link">作成</ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setInlineCreateStatus(null);
                                setInlineCreateTitle("");
                              }}
                              style={styles.secondaryBtn}
                            >
                              <ThemedText>キャンセル</ThemedText>
                            </Pressable>
                          </ThemedView>
                        </ThemedView>
                      ) : (
                        <Pressable
                          onPress={() => setInlineCreateStatus(status)}
                          style={styles.ghostBtn}
                        >
                          <ThemedText>課題を追加</ThemedText>
                        </Pressable>
                      )
                    ) : null}
                  </ThemedView>
                );
              })}
            </ThemedView>
          ) : null}

          {activeTab === "Backlog" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.rowBetween}>
                <ThemedText type="subtitle">Backlog</ThemedText>
                <Pressable onPress={handleCreateSprint} style={styles.primaryBtn}>
                  <ThemedText type="link">スプリントを作成</ThemedText>
                </Pressable>
              </ThemedView>
              {[...activeSprints, ...futureSprints, backlogSprint].map(
                (sprint) => {
                  const isBacklog =
                    sprint.id === backlogSprint.id ||
                    sprint.name.includes("バックログ");
                  const sprintIssues = issues.filter((issue) =>
                    isBacklog
                      ? !issue.sprintId || issue.sprintId === sprint.id
                      : issue.sprintId === sprint.id,
                  );
                  const sprintIssueOrder =
                    sprintOrder[sprint.id] ?? sprintIssues.map((issue) => issue.id);
                  const orderedSprintIssues = [...sprintIssues].sort(
                    (a, b) =>
                      sprintIssueOrder.indexOf(a.id) -
                      sprintIssueOrder.indexOf(b.id),
                  );
                  const backlogTargetId =
                    backlogSprint.id === "backlog"
                      ? undefined
                      : backlogSprint.id;
                  return (
                    <ThemedView key={sprint.id} style={styles.card}>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText type="defaultSemiBold">
                          {sprint.name}
                        </ThemedText>
                        <ThemedView style={styles.rowWrap}>
                          {!isBacklog && sprint.status === "future" ? (
                            <Pressable
                              onPress={() => handleStartSprint(sprint.id)}
                              style={styles.secondaryBtn}
                            >
                              <ThemedText>開始</ThemedText>
                            </Pressable>
                          ) : null}
                          {!isBacklog && sprint.status === "active" ? (
                            <Pressable
                              onPress={() => handleCompleteSprint(sprint)}
                              style={styles.primaryBtn}
                            >
                              <ThemedText type="link">完了</ThemedText>
                            </Pressable>
                          ) : null}
                          <ThemedText style={styles.metaText}>
                            {sprintIssues.length}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      {orderedSprintIssues.length === 0 ? (
                        <ThemedText style={styles.metaText}>
                          課題はありません。
                        </ThemedText>
                      ) : (
                        orderedSprintIssues.map((issue) => (
                          <ThemedView key={issue.id} style={styles.issueCard}>
                            <Pressable
                              onPress={() => handleOpenIssue(issue.id)}
                              style={styles.issueRow}
                            >
                              <ThemedText type="defaultSemiBold">
                                {issue.key}
                              </ThemedText>
                              <ThemedText>{issue.title}</ThemedText>
                            </Pressable>
                            <ThemedView style={styles.rowBetween}>
                              <ThemedText style={styles.metaText}>
                                {STATUS_LABELS[issue.status]}
                              </ThemedText>
                              <ThemedView style={styles.row}>
                                <Pressable
                                  onPress={() =>
                                    moveIssueInSprint(
                                      sprint.id,
                                      issue.id,
                                      "up",
                                    )
                                  }
                                  style={styles.ghostBtnSmall}
                                >
                                  <ThemedText>↑</ThemedText>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    moveIssueInSprint(
                                      sprint.id,
                                      issue.id,
                                      "down",
                                    )
                                  }
                                  style={styles.ghostBtnSmall}
                                >
                                  <ThemedText>↓</ThemedText>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    setMoveSprintIssueId(
                                      moveSprintIssueId === issue.id
                                        ? null
                                        : issue.id,
                                    )
                                  }
                                  style={styles.ghostBtnSmall}
                                >
                                  <ThemedText>移動</ThemedText>
                                </Pressable>
                              </ThemedView>
                            </ThemedView>
                            {moveSprintIssueId === issue.id ? (
                              <ThemedView style={styles.rowWrap}>
                                <Pressable
                                  onPress={() =>
                                    handleMoveIssueToSprint(
                                      issue.id,
                                      backlogTargetId,
                                    )
                                  }
                                  style={styles.actionChip}
                                >
                                  <ThemedText>バックログ</ThemedText>
                                </Pressable>
                                {[...activeSprints, ...futureSprints].map(
                                  (target) => (
                                    <Pressable
                                      key={target.id}
                                      onPress={() =>
                                        handleMoveIssueToSprint(
                                          issue.id,
                                          target.id,
                                        )
                                      }
                                      style={styles.actionChip}
                                    >
                                      <ThemedText>{target.name}</ThemedText>
                                    </Pressable>
                                  ),
                                )}
                              </ThemedView>
                            ) : null}
                          </ThemedView>
                        ))
                      )}

                      {inlineSprintId === sprint.id ? (
                        <ThemedView style={styles.inlineCreate}>
                          <TextInput
                            style={styles.input}
                            placeholder="課題タイトル"
                            value={inlineSprintTitle}
                            onChangeText={setInlineSprintTitle}
                          />
                          <ThemedView style={styles.row}>
                            <Pressable
                              onPress={() =>
                                handleInlineSprintCreate(
                                  isBacklog ? backlogTargetId : sprint.id,
                                )
                              }
                              style={styles.primaryBtn}
                            >
                              <ThemedText type="link">作成</ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setInlineSprintId(null);
                                setInlineSprintTitle("");
                              }}
                              style={styles.secondaryBtn}
                            >
                              <ThemedText>キャンセル</ThemedText>
                            </Pressable>
                          </ThemedView>
                        </ThemedView>
                      ) : (
                        <Pressable
                          onPress={() => setInlineSprintId(sprint.id)}
                          style={styles.ghostBtn}
                        >
                          <ThemedText>課題を追加</ThemedText>
                        </Pressable>
                      )}
                    </ThemedView>
                  );
                },
              )}
            </ThemedView>
          ) : null}

          {activeTab === "Timeline" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.row}>
                {(["week", "month", "quarter"] as const).map((zoom) => (
                  <Pressable
                    key={zoom}
                    onPress={() => setTimelineZoom(zoom)}
                    style={[
                      styles.boardToggle,
                      timelineZoom === zoom && styles.boardToggleActive,
                    ]}
                  >
                    <ThemedText>
                      {zoom === "week"
                        ? "週"
                        : zoom === "month"
                          ? "月"
                          : "四半期"}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
              <ThemedText style={styles.metaText}>
                {timelineConfig.start.toLocaleDateString()} -{" "}
                {timelineConfig.end.toLocaleDateString()}
              </ThemedText>
              {issues
                .slice()
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((issue) => {
                  const startDate = new Date(issue.createdAt);
                  const endDate = issue.dueDate
                    ? new Date(issue.dueDate)
                    : new Date(startDate.getTime() + 7 * 86400000);
                  const totalDays = timelineConfig.totalDays || 1;
                  const startDays =
                    (startDate.getTime() - timelineConfig.start.getTime()) /
                    86400000;
                  const endDays =
                    (endDate.getTime() - timelineConfig.start.getTime()) /
                    86400000;
                  const leftPercent = Math.max(
                    0,
                    Math.min(100, (startDays / totalDays) * 100),
                  );
                  const widthPercent = Math.max(
                    5,
                    ((endDays - startDays) / totalDays) * 100,
                  );

                  return (
                    <ThemedView key={issue.id} style={styles.timelineRow}>
                      <Pressable onPress={() => handleOpenIssue(issue.id)}>
                        <ThemedText type="defaultSemiBold">
                          {issue.key}
                        </ThemedText>
                        <ThemedText numberOfLines={1}>
                          {issue.title}
                        </ThemedText>
                      </Pressable>
                      <ThemedView style={styles.timelineTrack}>
                        <ThemedView
                          style={[
                            styles.timelineBar,
                            {
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            },
                          ]}
                        />
                      </ThemedView>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        value={dueDateDrafts[issue.id] ?? ""}
                        onChangeText={(value) =>
                          handleDueDateChange(issue.id, value)
                        }
                        onBlur={() => handleDueDateSave(issue)}
                      />
                    </ThemedView>
                  );
                })}
            </ThemedView>
          ) : null}

          {activeTab === "Releases" ? (
            <ThemedView style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Version name"
                value={newVersionName}
                onChangeText={setNewVersionName}
              />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newVersionDate}
                onChangeText={setNewVersionDate}
              />
              <Pressable onPress={handleCreateVersion} style={styles.primaryBtn}>
                <ThemedText type="link">Add version</ThemedText>
              </Pressable>
              {versions
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.releaseDate || 0).getTime() -
                    new Date(a.releaseDate || 0).getTime(),
                )
                .map((version) => {
                  const versionIssues = issues.filter(
                    (issue) => issue.fixVersionId === version.id,
                  );
                  const doneIssues = versionIssues.filter(
                    (issue) => issue.status === "Done",
                  );
                  const progress =
                    versionIssues.length > 0
                      ? Math.round(
                          (doneIssues.length / versionIssues.length) * 100,
                        )
                      : 0;
                  return (
                    <ThemedView key={version.id} style={styles.card}>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText type="defaultSemiBold">
                          {version.name}
                        </ThemedText>
                        <ThemedText style={styles.metaText}>
                          {version.status}
                        </ThemedText>
                      </ThemedView>
                      {version.releaseDate ? (
                        <ThemedText style={styles.metaText}>
                          {new Date(version.releaseDate).toLocaleDateString()}
                        </ThemedText>
                      ) : null}
                      <ThemedView style={styles.section}>
                        <ThemedView style={styles.rowBetween}>
                          <ThemedText style={styles.metaText}>
                            進捗 {progress}%
                          </ThemedText>
                          <ThemedText style={styles.metaText}>
                            {doneIssues.length} / {versionIssues.length} 完了
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.progressTrack}>
                          <ThemedView
                            style={[
                              styles.progressFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                  );
                })}
            </ThemedView>
          ) : null}

          {activeTab === "Automation" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.rowBetween}>
                <ThemedText type="subtitle">自動化</ThemedText>
                <Pressable
                  onPress={handleStartCreateRule}
                  style={styles.primaryBtn}
                >
                  <ThemedText type="link">ルールを追加</ThemedText>
                </Pressable>
              </ThemedView>
              <ThemedView style={styles.tabRow}>
                {(["rules", "logs"] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setAutomationTab(tab)}
                    style={[
                      styles.tab,
                      automationTab === tab && styles.tabActive,
                    ]}
                  >
                    <ThemedText>
                      {tab === "rules" ? "ルール一覧" : "監査ログ"}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
              {automationTab === "rules" ? (
                <ThemedView style={styles.section}>
                  {automationRules.length === 0 ? (
                    <ThemedText>ルールはまだありません。</ThemedText>
                  ) : (
                    automationRules.map((rule) => (
                      <ThemedView key={rule.id} style={styles.card}>
                        <ThemedText type="defaultSemiBold">
                          {rule.name}
                        </ThemedText>
                        <ThemedText>
                          {triggerLabelMap[rule.trigger]} →{" "}
                          {actionLabelMap[rule.action]}
                        </ThemedText>
                        <ThemedText>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </ThemedText>
                        <ThemedText>
                          最終実行:{" "}
                          {rule.lastRun
                            ? new Date(rule.lastRun).toLocaleString()
                            : "なし"}
                        </ThemedText>
                        <ThemedView style={styles.row}>
                          <Pressable
                            onPress={() => handleStartEditRule(rule)}
                            style={styles.secondaryBtn}
                          >
                            <ThemedText>編集</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              handleToggleRule(rule.id, rule.enabled)
                            }
                            style={styles.primaryBtn}
                          >
                            <ThemedText type="link">
                              {rule.enabled ? "Disable" : "Enable"}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setAutomationTab("logs");
                              setSelectedRuleId(rule.id);
                            }}
                            style={styles.ghostBtn}
                          >
                            <ThemedText>ログを表示</ThemedText>
                          </Pressable>
                        </ThemedView>
                      </ThemedView>
                    ))
                  )}
                </ThemedView>
              ) : (
                <ThemedView style={styles.section}>
                  <ThemedText type="subtitle">ルールを選択</ThemedText>
                  {automationRules.map((rule) => (
                    <Pressable
                      key={rule.id}
                      onPress={() => setSelectedRuleId(rule.id)}
                      style={[
                        styles.option,
                        selectedRuleId === rule.id && styles.optionActive,
                      ]}
                    >
                      <ThemedText>{rule.name}</ThemedText>
                    </Pressable>
                  ))}
                  {selectedRuleId ? (
                    automationLogs.length === 0 ? (
                      <ThemedText>ログはまだありません。</ThemedText>
                    ) : (
                      automationLogs.map((log) => (
                        <ThemedView key={log.id} style={styles.card}>
                          <ThemedText type="defaultSemiBold">
                            {log.status === "success"
                              ? "Success"
                              : "Failure"}
                          </ThemedText>
                          <ThemedText>{log.message}</ThemedText>
                          <ThemedText>
                            {new Date(log.executedAt).toLocaleString()}
                          </ThemedText>
                        </ThemedView>
                      ))
                    )
                  ) : (
                    <ThemedText>ルールを選択してください。</ThemedText>
                  )}
                </ThemedView>
              )}
            </ThemedView>
          ) : null}

          {activeTab === "Settings" ? (
            <ThemedView style={styles.section}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ThemedView style={styles.tabRow}>
                  {(
                    [
                      { key: "details", label: "詳細" },
                      { key: "workflow", label: "ワークフロー" },
                      { key: "permissions", label: "権限" },
                      { key: "notifications", label: "通知" },
                    ] as const
                  ).map((tab) => (
                    <Pressable
                      key={tab.key}
                      onPress={() => setSettingsTab(tab.key)}
                      style={[
                        styles.tab,
                        settingsTab === tab.key && styles.tabActive,
                      ]}
                    >
                      <ThemedText>{tab.label}</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              </ScrollView>

              {settingsTab === "details" ? (
                <ThemedView style={styles.section}>
                  <TextInput
                    style={styles.input}
                    placeholder="Project name"
                    value={projectName}
                    onChangeText={setProjectName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Project key"
                    value={projectKey}
                    editable={false}
                  />
                  <ThemedView style={styles.fieldGroup}>
                    <ThemedText type="defaultSemiBold">Category</ThemedText>
                    <ThemedView style={styles.inlineRow}>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => {
                        const selected = projectCategory === value;
                        return (
                          <Pressable
                            key={value}
                            onPress={() =>
                              setProjectCategory(value as Project["category"])
                            }
                            style={[
                              styles.chip,
                              selected && styles.chipSelected,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.chipText,
                                selected && styles.chipTextSelected,
                              ]}
                            >
                              {label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ThemedView>
                  </ThemedView>
                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    value={projectDescription}
                    onChangeText={setProjectDescription}
                  />
                  <ThemedView style={styles.rowBetween}>
                    <Pressable
                      onPress={handleSaveDetails}
                      style={styles.primaryBtn}
                    >
                      <ThemedText type="link">Save settings</ThemedText>
                    </Pressable>
                    {settingsSaved ? (
                      <ThemedText style={styles.helperText}>保存済み</ThemedText>
                    ) : null}
                  </ThemedView>
                  <Pressable onPress={handleDeleteProject} style={styles.dangerBtn}>
                    <ThemedText type="link">Delete project</ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}

              {settingsTab === "workflow" ? (
                <ThemedView style={styles.section}>
                  {workflowStatusOptions.map((status) => (
                    <ThemedView key={status} style={styles.workflowRow}>
                      <ThemedText type="defaultSemiBold">
                        {STATUS_LABELS[status]}
                      </ThemedText>
                      <ThemedView style={styles.rowWrap}>
                        {(workflowSettings[status] ?? []).length > 0 ? (
                          (workflowSettings[status] ?? []).map((next) => (
                            <ThemedText key={next} style={styles.metaBadge}>
                              {STATUS_LABELS[next as IssueStatus] ?? next}
                            </ThemedText>
                          ))
                        ) : (
                          <ThemedText style={styles.helperText}>遷移なし</ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  ))}
                  <Pressable
                    onPress={() => {
                      setWorkflowDraft(workflowSettings);
                      setShowWorkflowEditor(true);
                    }}
                    style={styles.secondaryBtn}
                  >
                    <ThemedText>ワークフローを編集</ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}

              {settingsTab === "permissions" ? (
                <ThemedView style={styles.section}>
                  {[
                    { label: "プロジェクトの参照", roles: "管理者、メンバー、閲覧者" },
                    { label: "課題の作成", roles: "管理者、メンバー" },
                    { label: "スプリントの管理", roles: "管理者" },
                    { label: "課題の削除", roles: "管理者" },
                  ].map((item) => (
                    <ThemedView key={item.label} style={styles.rowBetween}>
                      <ThemedText>{item.label}</ThemedText>
                      <ThemedText style={styles.helperText}>{item.roles}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}

              {settingsTab === "notifications" ? (
                <ThemedView style={styles.section}>
                  {Object.keys(DEFAULT_NOTIFICATION_SCHEME).map((eventKey) => (
                    <ThemedView key={eventKey} style={styles.workflowRow}>
                      <ThemedText type="defaultSemiBold">
                        {notificationLabels[
                          eventKey as keyof typeof notificationLabels
                        ] ?? eventKey}
                      </ThemedText>
                      <ThemedView style={styles.rowWrap}>
                        {(notificationSettings[eventKey] ?? []).map((recipient) => (
                          <ThemedText key={recipient} style={styles.metaBadge}>
                            {recipient}
                          </ThemedText>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  ))}
                  <Pressable
                    onPress={() => {
                      setNotificationDraft(notificationSettings);
                      setShowNotificationEditor(true);
                    }}
                    style={styles.secondaryBtn}
                  >
                    <ThemedText>通知スキームを編集</ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}
            </ThemedView>
          ) : null}
          </>
        ) : (
          <ThemedText>Project not found.</ThemedText>
        )}

      {completeSprint ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="subtitle">
              スプリント完了: {completeSprint.name}
            </ThemedText>
            <ThemedText>
              未完了の課題をどこへ移動しますか？
            </ThemedText>
            <Pressable
              onPress={() => setCompleteDestination("backlog")}
              style={[
                styles.option,
                completeDestination === "backlog" && styles.optionActive,
              ]}
            >
              <ThemedText>バックログ</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setCompleteDestination("next")}
              style={[
                styles.option,
                completeDestination === "next" && styles.optionActive,
              ]}
            >
              <ThemedText>次のスプリントへ</ThemedText>
            </Pressable>
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => setCompleteSprint(null)}
                style={styles.secondaryBtn}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleApplyCompleteSprint}
                style={styles.primaryBtn}
              >
                <ThemedText type="link">完了</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}

      {showAutomationForm ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="subtitle">
              {editingRule ? "自動化ルールの編集" : "自動化ルールの作成"}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="ルール名"
              value={ruleName}
              onChangeText={setRuleName}
            />
            <ThemedText type="subtitle">トリガー</ThemedText>
            {[
              { label: "課題の作成時", value: "issue_created" as const },
              { label: "ステータス変更時", value: "status_changed" as const },
              { label: "コメント投稿時", value: "comment_added" as const },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRuleTrigger(item.value)}
                style={[
                  styles.option,
                  ruleTrigger === item.value && styles.optionActive,
                ]}
              >
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            ))}
            <ThemedText type="subtitle">アクション</ThemedText>
            {[
              { label: "報告者に割り当て", value: "assign_reporter" as const },
              { label: "コメントを自動投稿", value: "add_comment" as const },
              {
                label: "優先度を「高」にする",
                value: "set_priority_high" as const,
              },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRuleAction(item.value)}
                style={[
                  styles.option,
                  ruleAction === item.value && styles.optionActive,
                ]}
              >
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            ))}
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => {
                  setShowAutomationForm(false);
                  resetAutomationForm();
                }}
                style={styles.secondaryBtn}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSaveAutomationRule}
                style={styles.primaryBtn}
              >
                <ThemedText type="link">保存</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}
      {showWorkflowEditor ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="subtitle">ワークフローを編集</ThemedText>
            <ScrollView style={styles.modalScroll}>
              {workflowStatusOptions.map((status) => (
                <ThemedView key={status} style={styles.fieldGroup}>
                  <ThemedText type="defaultSemiBold">
                    {STATUS_LABELS[status]}
                  </ThemedText>
                  <ThemedView style={styles.rowWrap}>
                    {workflowStatusOptions.map((nextStatus) => {
                      const selected =
                        workflowDraft[status]?.includes(nextStatus) ?? false;
                      return (
                        <Pressable
                          key={nextStatus}
                          onPress={() =>
                            toggleWorkflowTransition(status, nextStatus)
                          }
                          style={[
                            styles.option,
                            selected && styles.optionActive,
                          ]}
                        >
                          <ThemedText>{STATUS_LABELS[nextStatus]}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </ThemedView>
                </ThemedView>
              ))}
            </ScrollView>
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => setShowWorkflowEditor(false)}
                style={styles.secondaryBtn}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable onPress={handleSaveWorkflow} style={styles.primaryBtn}>
                <ThemedText type="link">保存</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}

      {showNotificationEditor ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="subtitle">通知スキーム</ThemedText>
            <ScrollView style={styles.modalScroll}>
              {Object.keys(DEFAULT_NOTIFICATION_SCHEME).map((eventKey) => (
                <ThemedView key={eventKey} style={styles.fieldGroup}>
                  <ThemedText type="defaultSemiBold">
                    {notificationLabels[
                      eventKey as keyof typeof notificationLabels
                    ] ?? eventKey}
                  </ThemedText>
                  <ThemedView style={styles.rowWrap}>
                    {notificationRecipients.map((recipient) => {
                      const selected =
                        notificationDraft[eventKey]?.includes(recipient) ??
                        false;
                      return (
                        <Pressable
                          key={recipient}
                          onPress={() =>
                            toggleNotificationRecipient(eventKey, recipient)
                          }
                          style={[
                            styles.option,
                            selected && styles.optionActive,
                          ]}
                        >
                          <ThemedText>{recipient}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </ThemedView>
                </ThemedView>
              ))}
            </ScrollView>
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => setShowNotificationEditor(false)}
                style={styles.secondaryBtn}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSaveNotifications}
                style={styles.primaryBtn}
              >
                <ThemedText type="link">保存</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}
      </ScrollView>
      {normalizedProjectId ? (
        <FloatingActionButton
          onPress={() =>
            router.push({
              pathname: "/modal",
              params: { mode: "issue", projectId: normalizedProjectId },
            })
          }
          accessibilityLabel="Create issue"
          style={styles.fab}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionChip: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  boardControls: {
    gap: 12,
  },
  boardToggle: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  boardToggleActive: {
    borderColor: "#2563eb",
  },
  card: {
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  container: {
    gap: 16,
    padding: 24,
  },
  dangerBtn: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 12,
  },
  chip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: "#2563eb",
  },
  chipText: {
    color: "#111827",
    fontSize: 12,
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  fieldGroup: {
    gap: 6,
  },
  filterChip: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: "#2563eb",
  },
  ghostBtnSmall: {
    alignItems: "center",
    borderColor: "#d1d5db",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  helperText: {
    color: "#6b7280",
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineCreate: {
    gap: 8,
  },
  issueCard: {
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  issueRow: {
    gap: 4,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%",
  },
  modalScroll: {
    maxHeight: 320,
  },
  metaBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: {
    color: "#6b7280",
    fontSize: 12,
  },
  overLimitText: {
    color: "#dc2626",
  },
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: {
    borderColor: "#2563eb",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 16,
  },
  primaryBtn: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  progressFill: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    height: 6,
  },
  progressTrack: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 6,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  screen: {
    flex: 1,
  },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  section: {
    gap: 12,
  },
  ghostBtn: {
    alignItems: "center",
    borderColor: "#d1d5db",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tab: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    borderColor: "#2563eb",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  statCard: {
    borderRadius: 12,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineBar: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    height: 8,
    position: "absolute",
    top: 6,
  },
  timelineRow: {
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  timelineTrack: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 20,
    position: "relative",
  },
  workflowRow: {
    gap: 8,
  },
  fab: {
    bottom: 32,
  },
});
