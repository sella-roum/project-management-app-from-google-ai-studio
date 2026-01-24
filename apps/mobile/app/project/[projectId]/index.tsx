import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
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
  Project,
  Sprint,
} from "@repo/core";
import {
  createAutomationRule,
  createIssue,
  createVersion,
  deleteProject,
  getAutomationLogs,
  getAutomationRules,
  getCurrentUserId,
  recordView,
  toggleAutomationRule,
  updateAutomationRule,
  updateIssue,
  updateIssueStatus,
  updateProject,
  updateSprintStatus,
  createSprint,
  USERS,
} from "@repo/storage";

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Input } from "@/components/ui/input";
import { useProjectData } from "@/components/project/project-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { strings } from "@/constants/strings";

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

type ProjectViewProps = {
  initialTab: (typeof TABS)[number];
  showTabs?: boolean;
};

export function ProjectView({ initialTab, showTabs = false }: ProjectViewProps) {
  const router = useRouter();
  const { ready, projectId, project, issues, sprints, versions, stats, error, reload } =
    useProjectData();
  const normalizedProjectId = projectId;
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(initialTab);
  const [boardStatusIndex, setBoardStatusIndex] = useState(0);
  const [boardSwimlane, setBoardSwimlane] = useState<
    "none" | "assignee"
  >("none");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const borderStrong = useThemeColor({}, "borderStrong");
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const surfaceBase = useThemeColor({}, "surfaceBase");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const surfaceOverlay = useThemeColor({}, "surfaceOverlay");
  const textPrimary = useThemeColor({}, "textPrimary");
  const textSecondary = useThemeColor({}, "textSecondary");
  const textTertiary = useThemeColor({}, "textTertiary");
  const textOnBrand = useThemeColor({}, "textOnBrand");
  const stateErrorBg = useThemeColor({}, "stateErrorBg");
  const stateErrorText = useThemeColor({}, "stateErrorText");
  const cardStyle = [styles.card, { backgroundColor: surfaceRaised }];
  const statCardStyle = [styles.statCard, { backgroundColor: surfaceRaised }];
  const primaryButtonStyle = [styles.primaryBtn, { backgroundColor: brandPrimary }];
  const secondaryButtonStyle = [
    styles.secondaryBtn,
    { backgroundColor: surfaceOverlay },
  ];
  const ghostButtonStyle = [styles.ghostBtn, { borderColor: borderStrong }];
  const ghostButtonSmallStyle = [
    styles.ghostBtnSmall,
    { borderColor: borderStrong },
  ];
  const tabStyle = [styles.tab, { borderColor: borderSubtle }];
  const tabActiveStyle = { borderColor: brandPrimary };
  const boardToggleStyle = [styles.boardToggle, { borderColor: borderSubtle }];
  const boardToggleActiveStyle = { borderColor: brandPrimary };
  const filterChipStyle = [styles.filterChip, { borderColor: borderSubtle }];
  const filterChipActiveStyle = { borderColor: brandPrimary };
  const actionChipStyle = [styles.actionChip, { borderColor: borderSubtle }];
  const optionStyle = [styles.option, { borderColor: borderSubtle }];
  const optionActiveStyle = { borderColor: brandPrimary };
  const chipStyle = [styles.chip, { backgroundColor: surfaceOverlay }];
  const chipSelectedStyle = { backgroundColor: brandPrimary };
  const metaBadgeStyle = [
    styles.metaBadge,
    { backgroundColor: surfaceOverlay, color: textSecondary },
  ];
  const progressTrackStyle = [
    styles.progressTrack,
    { backgroundColor: surfaceOverlay },
  ];
  const progressFillStyle = [
    styles.progressFill,
    { backgroundColor: brandPrimary },
  ];
  const timelineTrackStyle = [
    styles.timelineTrack,
    { backgroundColor: surfaceOverlay },
  ];
  const timelineBarStyle = [
    styles.timelineBar,
    { backgroundColor: brandPrimary },
  ];
  const [boardFilters, setBoardFilters] = useState<("mine" | "recent")[]>([]);
  const [inlineCreateStatus, setInlineCreateStatus] = useState<IssueStatus | null>(
    null,
  );
  const [inlineCreateTitle, setInlineCreateTitle] = useState("");
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
    Record<IssueStatus, IssueStatus[]>
  >({} as Record<IssueStatus, IssueStatus[]>);
  const [notificationSettings, setNotificationSettings] = useState<
    Record<string, string[]>
  >({});
  const [settingsTab, setSettingsTab] = useState<
    "details" | "workflow" | "permissions" | "notifications"
  >("details");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const settingsSavedTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showNotificationEditor, setShowNotificationEditor] = useState(false);
  const [workflowDraft, setWorkflowDraft] = useState<
    Record<IssueStatus, IssueStatus[]>
  >({} as Record<IssueStatus, IssueStatus[]>);
  const [notificationDraft, setNotificationDraft] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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
  const isAnyModalOpen =
    showNotificationEditor || showAutomationForm || showWorkflowEditor || Boolean(completeSprint);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isAnyModalOpen]);

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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!error) return;
    Alert.alert("読み込みエラー", "プロジェクトデータの取得に失敗しました。");
  }, [error]);

  useEffect(() => {
    const workflow = (project?.workflowSettings ??
      WORKFLOW_TRANSITIONS) as Record<IssueStatus, IssueStatus[]>;
    const notifications =
      project?.notificationSettings ?? DEFAULT_NOTIFICATION_SCHEME;
    setProjectName(project?.name ?? "");
    setProjectKey(project?.key ?? "");
    setProjectDescription(project?.description ?? "");
    setProjectCategory(project?.category ?? "");
    const workflowEntries = Object.fromEntries(
      Object.entries(workflow).map(([status, next]) => [
        status as IssueStatus,
        [...next],
      ]),
    ) as Record<IssueStatus, IssueStatus[]>;
    setWorkflowSettings(workflowEntries);
    setWorkflowDraft(workflowEntries);
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
  }, [project, initialTab]);

  useEffect(() => {
    if (!ready || !projectId) return;
    const loadRules = async () => {
      const ruleData = await getAutomationRules(projectId);
      setAutomationRules(ruleData.map((rule) => rule));
    };
    void loadRules();
  }, [ready, projectId]);

  useEffect(() => {
    return () => {
      if (settingsSavedTimeoutRef.current) {
        clearTimeout(settingsSavedTimeoutRef.current);
      }
    };
  }, []);

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
    const next: Record<string, string> = {};
    issues.forEach((issue) => {
      next[issue.id] = issue.dueDate ? issue.dueDate.slice(0, 10) : "";
    });
    setDueDateDrafts(next);
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
    if (settingsSavedTimeoutRef.current) {
      clearTimeout(settingsSavedTimeoutRef.current);
      settingsSavedTimeoutRef.current = null;
    }
    try {
      await updateProject(normalizedProjectId, {
        name: projectName,
        description: projectDescription,
        category: projectCategory || project?.category || "Software",
      });
      await reload();
      setSettingsSaved(true);
      settingsSavedTimeoutRef.current = setTimeout(
        () => {
          setSettingsSaved(false);
          settingsSavedTimeoutRef.current = null;
        },
        2000,
      );
    } catch (error) {
      console.error("Failed to save project details", error);
      setSettingsSaved(false);
    }
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
    let releaseDate: string | undefined;
    if (newVersionDate) {
      const parsedDate = new Date(newVersionDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert("日付形式エラー", "YYYY-MM-DD 形式で入力してください。");
        return;
      }
      releaseDate = parsedDate.toISOString();
    }
    await createVersion({
      projectId: normalizedProjectId,
      name: newVersionName,
      releaseDate,
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
    try {
      const result = await updateIssueStatus(issueId, status);
      if (!result) {
        Alert.alert("ステータス変更不可", "この遷移は許可されていません。");
        return;
      }
      await reload();
    } catch (error) {
      console.error("Failed to move issue", error);
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました。";
      Alert.alert("エラー", message);
    }
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
    let completed = false;
    try {
      if (completeDestination === "next") {
        const newSprint = await createSprint(normalizedProjectId);
        targetSprintId = newSprint.id;
      }
      const updates = incomplete.map((issue) =>
        updateIssue(issue.id, { sprintId: targetSprintId }),
      );
      await Promise.all(updates);
      await updateSprintStatus(completeSprint.id, "completed");
      await reload();
      completed = true;
    } catch (error) {
      console.error("Failed to complete sprint", error);
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました。";
      Alert.alert(
        "完了エラー",
        message,
      );
    } finally {
      if (completed) {
        setCompleteSprint(null);
      }
    }
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
    try {
      await updateIssue(issueId, { sprintId });
      await reload();
    } catch (error) {
      console.error("Failed to move issue to sprint", error);
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました。";
      Alert.alert("エラー", message);
    } finally {
      setMoveSprintIssueId(null);
    }
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

  const currentUserId = useMemo(() => getCurrentUserId(), []);

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
    const backlogId = `__backlog__:${normalizedProjectId ?? "unknown"}`;
    return {
      id: backlogId,
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

    const totalDays = Math.max(
      1,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

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
  const activeBoardStatus = BOARD_STATUSES[boardStatusIndex];

  const renderBoardColumn = (status: IssueStatus) => {
    const columnIssues = filteredIssues.filter(
      (issue) => issue.status === status,
    );
    const order = boardOrder[status] ?? [];
    const orderIndex = new Map(order.map((id, index) => [id, index]));
    const orderedIssues = [...columnIssues].sort((a, b) => {
      const aIndex = orderIndex.get(a.id) ?? order.length;
      const bIndex = orderIndex.get(b.id) ?? order.length;
      return aIndex - bIndex;
    });
    const limit = project?.columnSettings?.[status]?.limit;
    const isOverLimit = Boolean(limit && columnIssues.length > limit);

    const renderIssue = (issue: Issue) => {
      const assigneeName =
        USERS.find((user) => user.id === issue.assigneeId)?.name || "未割り当て";
      const allowed = workflowSettings[issue.status] ?? [];
      return (
        <ThemedView
          key={issue.id}
          style={[styles.issueCard, { backgroundColor: surfaceBase }]}
        >
          <Pressable
            onPress={() => handleOpenIssue(issue.id)}
            onLongPress={() => {
              if (allowed.length === 0) return;
              Alert.alert(
                "ステータスを変更",
                "次のステータスを選択してください。",
                [
                  ...allowed.map((next) => ({
                    text: STATUS_LABELS[next],
                    onPress: () => handleMoveIssue(issue.id, next),
                  })),
                  { text: "キャンセル", style: "cancel" },
                ],
              );
            }}
            style={styles.issueRow}
          >
            <ThemedText type="bodySemiBold">{issue.key}</ThemedText>
            <ThemedText>{issue.title}</ThemedText>
          </Pressable>
          <ThemedView style={styles.rowBetween}>
            <ThemedText style={[styles.metaText, { color: textSecondary }]}>
              {assigneeName}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      );
    };

    return (
        <ThemedView
          key={status}
          style={[styles.card, { backgroundColor: surfaceRaised }]}
        >
          <ThemedView style={styles.rowBetween}>
            <ThemedText type="bodySemiBold">
              {STATUS_LABELS[status]}
            </ThemedText>
            <ThemedText
            style={[
              styles.metaText,
              { color: textSecondary },
              isOverLimit && { color: stateErrorText },
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
                  : orderedIssues.filter((i) => i.assigneeId === lane.id);
            if (laneIssues.length === 0) return null;
            return (
              <ThemedView key={`${status}-${lane.id}`} style={styles.section}>
                <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                  {lane.name} ({laneIssues.length})
                </ThemedText>
                {laneIssues.map(renderIssue)}
              </ThemedView>
            );
          })
        ) : orderedIssues.length === 0 ? (
          <ThemedText style={[styles.metaText, { color: textSecondary }]}>
            課題はありません。
          </ThemedText>
        ) : (
          orderedIssues.map(renderIssue)
        )}

        {status === "To Do" ? (
          inlineCreateStatus === status ? (
            <ThemedView style={styles.inlineCreate}>
              <Input
                placeholder="課題タイトル"
                value={inlineCreateTitle}
                onChangeText={setInlineCreateTitle}
              />
              <ThemedView style={styles.row}>
                <Pressable
                  onPress={() => handleInlineCreate(status)}
                  style={primaryButtonStyle}
                >
                  <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                    作成
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setInlineCreateStatus(null);
                    setInlineCreateTitle("");
                  }}
                  style={secondaryButtonStyle}
                >
                  <ThemedText>キャンセル</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          ) : (
            <Pressable
              onPress={() => setInlineCreateStatus(status)}
              style={ghostButtonStyle}
            >
              <ThemedText>課題を追加</ThemedText>
            </Pressable>
          )
        ) : null}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Project</ThemedText>
        {!ready ? (
          <ThemedView style={cardStyle}>
            <Skeleton height={20} width={180} />
            <Skeleton height={14} width={240} />
          </ThemedView>
        ) : error ? (
          <EmptyState
            title="データの読み込みに失敗しました"
            description="通信状況を確認して再度お試しください。"
            actionLabel="再読み込み"
            onAction={reload}
          />
        ) : project ? (
          <>
            <ThemedText type="headline">{project.name}</ThemedText>
            <ThemedText>{project.key}</ThemedText>
            <Link
              href={{
                pathname: "/modal",
                params: { mode: "issue", projectId: project.id },
              }}
            >
              <ThemedText type="link">{strings.common.createIssue}</ThemedText>
            </Link>
            {showTabs ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ThemedView style={styles.tabRow}>
                  {TABS.map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={[tabStyle, activeTab === tab && tabActiveStyle]}
                    >
                      <ThemedText>{tab}</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              </ScrollView>
            ) : null}

          {activeTab === "Summary" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.statsRow}>
                <ThemedView style={statCardStyle}>
                  <ThemedText type="bodySemiBold">
                    {issues.filter((i) => i.status !== "Done").length}
                  </ThemedText>
                  <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                    未完了
                  </ThemedText>
                </ThemedView>
                <ThemedView style={statCardStyle}>
                  <ThemedText type="bodySemiBold">
                    {statusCounts["Done"] || 0}
                  </ThemedText>
                  <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                    完了
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={cardStyle}>
                <ThemedText type="headline">サマリー</ThemedText>
                <ThemedText>{issues.length} issues</ThemedText>
                <ThemedText>{versions.length} versions</ThemedText>
              </ThemedView>
              {stats && stats.workload.length > 0 ? (
                <ThemedView style={cardStyle}>
                  <ThemedText type="headline">ワークロード</ThemedText>
                  {stats.workload.map((item) => (
                    <ThemedView key={item.userName} style={styles.rowBetween}>
                      <ThemedText>{item.userName}</ThemedText>
                      <ThemedText>{item.count}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}
              {stats && stats.epicProgress.length > 0 ? (
                <ThemedView style={cardStyle}>
                  <ThemedText type="headline">エピック進捗</ThemedText>
                  {stats.epicProgress.map((epic) => (
                    <ThemedView key={epic.id} style={styles.rowBetween}>
                      <ThemedText numberOfLines={1}>{epic.title}</ThemedText>
                      <ThemedText>{epic.percent}%</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}
              <ThemedView style={cardStyle}>
                <ThemedText type="headline">ステータス合計</ThemedText>
                {(Object.keys(STATUS_LABELS) as IssueStatus[]).map((status) => (
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
                      boardToggleStyle,
                      boardSwimlane === "none" && boardToggleActiveStyle,
                    ]}
                  >
                    <ThemedText>スタンダード</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setBoardSwimlane("assignee")}
                    style={[
                      boardToggleStyle,
                      boardSwimlane === "assignee" && boardToggleActiveStyle,
                    ]}
                  >
                    <ThemedText>担当者別</ThemedText>
                  </Pressable>
                </ThemedView>
                <ThemedView style={styles.rowWrap}>
                  <Pressable
                    onPress={() => toggleBoardFilter("mine")}
                    style={[
                      filterChipStyle,
                      boardFilters.includes("mine") && filterChipActiveStyle,
                    ]}
                  >
                    <ThemedText>自分の課題</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleBoardFilter("recent")}
                    style={[
                      filterChipStyle,
                      boardFilters.includes("recent") && filterChipActiveStyle,
                    ]}
                  >
                    <ThemedText>最近更新</ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.rowBetween}>
                <Pressable
                  onPress={() =>
                    setBoardStatusIndex((prev) => Math.max(0, prev - 1))
                  }
                  style={secondaryButtonStyle}
                  disabled={boardStatusIndex === 0}
                >
                  <ThemedText>前へ</ThemedText>
                </Pressable>
                <ThemedText type="bodySemiBold">
                  {STATUS_LABELS[activeBoardStatus]}
                </ThemedText>
                <Pressable
                  onPress={() =>
                    setBoardStatusIndex((prev) =>
                      Math.min(BOARD_STATUSES.length - 1, prev + 1),
                    )
                  }
                  style={secondaryButtonStyle}
                  disabled={boardStatusIndex === BOARD_STATUSES.length - 1}
                >
                  <ThemedText>次へ</ThemedText>
                </Pressable>
              </ThemedView>
              {renderBoardColumn(activeBoardStatus)}
            </ThemedView>
          ) : null}

          {activeTab === "Backlog" ? (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.rowBetween}>
                <ThemedText type="headline">Backlog</ThemedText>
                <Pressable onPress={handleCreateSprint} style={primaryButtonStyle}>
                  <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                    スプリントを作成
                  </ThemedText>
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
                  const sprintOrderIndex = new Map(
                    sprintIssueOrder.map((id, index) => [id, index]),
                  );
                  const orderedSprintIssues = [...sprintIssues].sort(
                    (a, b) => {
                      const aIndex =
                        sprintOrderIndex.get(a.id) ?? sprintIssueOrder.length;
                      const bIndex =
                        sprintOrderIndex.get(b.id) ?? sprintIssueOrder.length;
                      return aIndex - bIndex;
                    },
                  );
                  const backlogTargetId =
                    backlogSprint.id.startsWith("__backlog__:")
                      ? undefined
                      : backlogSprint.id;
                  return (
                    <ThemedView key={sprint.id} style={cardStyle}>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText type="bodySemiBold">
                          {sprint.name}
                        </ThemedText>
                        <ThemedView style={styles.rowWrap}>
                          {!isBacklog && sprint.status === "future" ? (
                            <Pressable
                              onPress={() => handleStartSprint(sprint.id)}
                              style={secondaryButtonStyle}
                            >
                              <ThemedText>開始</ThemedText>
                            </Pressable>
                          ) : null}
                          {!isBacklog && sprint.status === "active" ? (
                            <Pressable
                              onPress={() => handleCompleteSprint(sprint)}
                              style={primaryButtonStyle}
                            >
                              <ThemedText
                                style={{ color: textOnBrand }}
                                type="bodySemiBold"
                              >
                                完了
                              </ThemedText>
                            </Pressable>
                          ) : null}
                          <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                            {sprintIssues.length}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      {orderedSprintIssues.length === 0 ? (
                        <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                          課題はありません。
                        </ThemedText>
                      ) : (
                        orderedSprintIssues.map((issue) => (
                          <ThemedView
                            key={issue.id}
                            style={[styles.issueCard, { backgroundColor: surfaceBase }]}
                          >
                            <Pressable
                              onPress={() => handleOpenIssue(issue.id)}
                              style={styles.issueRow}
                            >
                              <ThemedText type="bodySemiBold">
                                {issue.key}
                              </ThemedText>
                              <ThemedText>{issue.title}</ThemedText>
                            </Pressable>
                            <ThemedView style={styles.rowBetween}>
                              <ThemedText style={[styles.metaText, { color: textSecondary }]}>
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
                                  style={ghostButtonSmallStyle}
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
                                  style={ghostButtonSmallStyle}
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
                                  style={ghostButtonSmallStyle}
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
                                  style={actionChipStyle}
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
                                      style={actionChipStyle}
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
                          <Input
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
                              style={primaryButtonStyle}
                            >
                              <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                                作成
                              </ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setInlineSprintId(null);
                                setInlineSprintTitle("");
                              }}
                              style={secondaryButtonStyle}
                            >
                              <ThemedText>キャンセル</ThemedText>
                            </Pressable>
                          </ThemedView>
                        </ThemedView>
                      ) : (
                        <Pressable
                          onPress={() => setInlineSprintId(sprint.id)}
                          style={ghostButtonStyle}
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
                      boardToggleStyle,
                      timelineZoom === zoom && boardToggleActiveStyle,
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
              <ThemedText style={[styles.metaText, { color: textSecondary }]}>
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
                  const totalDays = timelineConfig.totalDays;
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
                        <ThemedText type="bodySemiBold">
                          {issue.key}
                        </ThemedText>
                        <ThemedText numberOfLines={1}>
                          {issue.title}
                        </ThemedText>
                      </Pressable>
                      <ThemedView style={timelineTrackStyle}>
                        <ThemedView
                          style={[
                            timelineBarStyle,
                            {
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            },
                          ]}
                        />
                      </ThemedView>
                      <Input
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
              <Input
                placeholder="Version name"
                value={newVersionName}
                onChangeText={setNewVersionName}
              />
              <Input
                placeholder="YYYY-MM-DD"
                value={newVersionDate}
                onChangeText={setNewVersionDate}
              />
              <Pressable onPress={handleCreateVersion} style={primaryButtonStyle}>
                <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                  {strings.common.addVersion}
                </ThemedText>
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
                    <ThemedView key={version.id} style={cardStyle}>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText type="bodySemiBold">
                          {version.name}
                        </ThemedText>
                        <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                          {version.status}
                        </ThemedText>
                      </ThemedView>
                      {version.releaseDate ? (
                        <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                          {new Date(version.releaseDate).toLocaleDateString()}
                        </ThemedText>
                      ) : null}
                      <ThemedView style={styles.section}>
                        <ThemedView style={styles.rowBetween}>
                          <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                            進捗 {progress}%
                          </ThemedText>
                          <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                            {doneIssues.length} / {versionIssues.length} 完了
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={progressTrackStyle}>
                          <ThemedView
                            style={[progressFillStyle, { width: `${progress}%` }]}
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
                <ThemedText type="headline">自動化</ThemedText>
                <Pressable
                  onPress={handleStartCreateRule}
                  style={primaryButtonStyle}
                >
                  <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                    ルールを追加
                  </ThemedText>
                </Pressable>
              </ThemedView>
              <ThemedView style={styles.tabRow}>
                {(["rules", "logs"] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setAutomationTab(tab)}
                    style={[
                      tabStyle,
                      automationTab === tab && tabActiveStyle,
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
                      <ThemedView key={rule.id} style={cardStyle}>
                        <ThemedText type="bodySemiBold">
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
                            style={secondaryButtonStyle}
                          >
                            <ThemedText>編集</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              handleToggleRule(rule.id, rule.enabled)
                            }
                            style={primaryButtonStyle}
                          >
                            <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                              {rule.enabled ? "Disable" : "Enable"}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setAutomationTab("logs");
                              setSelectedRuleId(rule.id);
                            }}
                            style={ghostButtonStyle}
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
                  <ThemedText type="headline">ルールを選択</ThemedText>
                  {automationRules.map((rule) => (
                    <Pressable
                      key={rule.id}
                      onPress={() => setSelectedRuleId(rule.id)}
                      style={[
                        optionStyle,
                        selectedRuleId === rule.id && optionActiveStyle,
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
                        <ThemedView key={log.id} style={cardStyle}>
                          <ThemedText type="bodySemiBold">
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
                        tabStyle,
                        settingsTab === tab.key && tabActiveStyle,
                      ]}
                    >
                      <ThemedText>{tab.label}</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              </ScrollView>

              {settingsTab === "details" ? (
                <ThemedView style={styles.section}>
                  <Input
                    placeholder="Project name"
                    value={projectName}
                    onChangeText={setProjectName}
                  />
                  <Input
                    placeholder="Project key"
                    value={projectKey}
                    editable={false}
                  />
                  <ThemedView style={styles.fieldGroup}>
                    <ThemedText type="bodySemiBold">Category</ThemedText>
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
                              chipStyle,
                              selected && chipSelectedStyle,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.chipText,
                                { color: textPrimary },
                                selected && { color: textOnBrand },
                              ]}
                            >
                              {label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ThemedView>
                  </ThemedView>
                  <Input
                    placeholder="Description"
                    value={projectDescription}
                    onChangeText={setProjectDescription}
                  />
                  <ThemedView style={styles.rowBetween}>
                    <Pressable
                      onPress={handleSaveDetails}
                      style={primaryButtonStyle}
                    >
                      <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                        Save settings
                      </ThemedText>
                    </Pressable>
                    {settingsSaved ? (
                      <ThemedText style={[styles.helperText, { color: textTertiary }]}>
                        保存済み
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                  <Pressable
                    onPress={handleDeleteProject}
                    style={[styles.dangerBtn, { backgroundColor: stateErrorBg }]}
                  >
                    <ThemedText style={{ color: stateErrorText }} type="bodySemiBold">
                      Delete project
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}

              {settingsTab === "workflow" ? (
                <ThemedView style={styles.section}>
                  {workflowStatusOptions.map((status) => (
                    <ThemedView key={status} style={styles.workflowRow}>
                      <ThemedText type="bodySemiBold">
                        {STATUS_LABELS[status]}
                      </ThemedText>
                      <ThemedView style={styles.rowWrap}>
                        {(workflowSettings[status] ?? []).length > 0 ? (
                          (workflowSettings[status] ?? []).map((next) => (
                            <ThemedText key={next} style={metaBadgeStyle}>
                              {STATUS_LABELS[next] ?? next}
                            </ThemedText>
                          ))
                        ) : (
                          <ThemedText style={[styles.helperText, { color: textTertiary }]}>
                            遷移なし
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  ))}
                  <Pressable
                    onPress={() => {
                      setWorkflowDraft(workflowSettings);
                      setShowWorkflowEditor(true);
                    }}
                    style={secondaryButtonStyle}
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
                      <ThemedText style={[styles.helperText, { color: textTertiary }]}>
                        {item.roles}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : null}

              {settingsTab === "notifications" ? (
                <ThemedView style={styles.section}>
                  {Object.keys(DEFAULT_NOTIFICATION_SCHEME).map((eventKey) => (
                    <ThemedView key={eventKey} style={styles.workflowRow}>
                      <ThemedText type="bodySemiBold">
                        {notificationLabels[
                          eventKey as keyof typeof notificationLabels
                        ] ?? eventKey}
                      </ThemedText>
                      <ThemedView style={styles.rowWrap}>
                        {(notificationSettings[eventKey] ?? []).map((recipient) => (
                          <ThemedText key={recipient} style={metaBadgeStyle}>
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
                    style={secondaryButtonStyle}
                  >
                    <ThemedText>通知スキームを編集</ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}
            </ThemedView>
          ) : null}
          </>
        ) : (
          <EmptyState
            title="Project not found."
            description="このプロジェクトは見つかりませんでした。"
          />
        )}

      {completeSprint ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: surfaceRaised }]}>
            <ThemedText type="headline">
              スプリント完了: {completeSprint.name}
            </ThemedText>
            <ThemedText>
              未完了の課題をどこへ移動しますか？
            </ThemedText>
            <Pressable
              onPress={() => setCompleteDestination("backlog")}
              style={[
                optionStyle,
                completeDestination === "backlog" && optionActiveStyle,
              ]}
            >
              <ThemedText>バックログ</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setCompleteDestination("next")}
              style={[
                optionStyle,
                completeDestination === "next" && optionActiveStyle,
              ]}
            >
              <ThemedText>次のスプリントへ</ThemedText>
            </Pressable>
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => setCompleteSprint(null)}
                style={secondaryButtonStyle}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleApplyCompleteSprint}
                style={primaryButtonStyle}
              >
                <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                  完了
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}

      {showAutomationForm ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: surfaceRaised }]}>
            <ThemedText type="headline">
              {editingRule ? "自動化ルールの編集" : "自動化ルールの作成"}
            </ThemedText>
            <Input
              placeholder="ルール名"
              value={ruleName}
              onChangeText={setRuleName}
            />
            <ThemedText type="headline">トリガー</ThemedText>
            {[
              { label: "課題の作成時", value: "issue_created" as const },
              { label: "ステータス変更時", value: "status_changed" as const },
              { label: "コメント投稿時", value: "comment_added" as const },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRuleTrigger(item.value)}
                style={[
                  optionStyle,
                  ruleTrigger === item.value && optionActiveStyle,
                ]}
              >
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            ))}
            <ThemedText type="headline">アクション</ThemedText>
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
                  optionStyle,
                  ruleAction === item.value && optionActiveStyle,
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
                style={secondaryButtonStyle}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSaveAutomationRule}
                style={primaryButtonStyle}
              >
                <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                  保存
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}
      {showWorkflowEditor ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: surfaceRaised }]}>
            <ThemedText type="headline">ワークフローを編集</ThemedText>
            <ScrollView style={styles.modalScroll}>
              {workflowStatusOptions.map((status) => (
                <ThemedView key={status} style={styles.fieldGroup}>
                  <ThemedText type="bodySemiBold">
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
                            optionStyle,
                            selected && optionActiveStyle,
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
                style={secondaryButtonStyle}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable onPress={handleSaveWorkflow} style={primaryButtonStyle}>
                <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                  保存
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}

      {showNotificationEditor ? (
        <ThemedView style={styles.overlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: surfaceRaised }]}>
            <ThemedText type="headline">通知スキーム</ThemedText>
            <ScrollView style={styles.modalScroll}>
              {Object.keys(DEFAULT_NOTIFICATION_SCHEME).map((eventKey) => (
                <ThemedView key={eventKey} style={styles.fieldGroup}>
                  <ThemedText type="bodySemiBold">
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
                            optionStyle,
                            selected && optionActiveStyle,
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
                style={secondaryButtonStyle}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSaveNotifications}
                style={primaryButtonStyle}
              >
                <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
                  保存
                </ThemedText>
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

export default function ProjectIndexRedirect() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  useEffect(() => {
    if (!projectId) return;
    const normalized = Array.isArray(projectId) ? projectId[0] : projectId;
    router.replace(`/project/${normalized}/summary`);
  }, [projectId, router]);

  return null;
}

const styles = StyleSheet.create({
  actionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  boardControls: {
    gap: 12,
  },
  boardToggle: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderRadius: 12,
    paddingVertical: 12,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ghostBtnSmall: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  helperText: {
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%",
  },
  modalScroll: {
    maxHeight: 320,
  },
  metaBadge: {
    borderRadius: 999,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 12,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 16,
  },
  primaryBtn: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  progressFill: {
    borderRadius: 999,
    height: 6,
  },
  progressTrack: {
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
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  section: {
    gap: 12,
  },
  ghostBtn: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tab: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
