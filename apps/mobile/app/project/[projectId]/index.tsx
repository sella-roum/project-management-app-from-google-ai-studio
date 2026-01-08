import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import {
  CATEGORY_LABELS,
  DEFAULT_NOTIFICATION_SCHEME,
  WORKFLOW_TRANSITIONS,
} from "@repo/core";
import type {
  AutomationLog,
  AutomationRule,
  Issue,
  Project,
  Version,
} from "@repo/core";
import {
  createAutomationRule,
  createVersion,
  deleteProject,
  getAutomationRules,
  getAutomationLogs,
  getIssues,
  getProjectById,
  getVersions,
  recordView,
  toggleAutomationRule,
  updateAutomationRule,
  updateProject,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectCategory, setProjectCategory] = useState<
    Project["category"] | ""
  >("");
  const [newVersionName, setNewVersionName] = useState("");
  const [workflowSettings, setWorkflowSettings] = useState<
    Record<string, string[]>
  >({});
  const [notificationSettings, setNotificationSettings] = useState<
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
    const [projectData, issueData, versionData, ruleData] =
      await Promise.all([
        getProjectById(normalizedProjectId),
        getIssues(normalizedProjectId),
        getVersions(normalizedProjectId),
        getAutomationRules(normalizedProjectId),
      ]);
    setProject(projectData);
    setIssues(issueData);
    setVersions(versionData);
    setAutomationRules(ruleData.map((rule) => rule));
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
    setNotificationSettings(
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

  const handleSaveSettings = async () => {
    if (!normalizedProjectId) return;
    await updateProject(normalizedProjectId, {
      name: projectName,
      description: projectDescription,
      category: projectCategory || project?.category || "Software",
      workflowSettings,
      notificationSettings,
    });
    await reload();
  };

  const handleDeleteProject = async () => {
    if (!normalizedProjectId) return;
    await deleteProject(normalizedProjectId);
    router.replace("/(tabs)/projects");
  };

  const handleCreateVersion = async () => {
    if (!normalizedProjectId || !newVersionName) return;
    await createVersion({
      projectId: normalizedProjectId,
      name: newVersionName,
    });
    setNewVersionName("");
    await reload();
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

  const groupedIssues = useMemo(() => {
    return issues.reduce<Record<string, Issue[]>>((acc, issue) => {
      acc[issue.status] = acc[issue.status] || [];
      acc[issue.status].push(issue);
      return acc;
    }, {});
  }, [issues]);

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

  const parseListInput = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  return (
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
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Summary</ThemedText>
              <ThemedText>{issues.length} issues</ThemedText>
              <ThemedText>{versions.length} versions</ThemedText>
            </ThemedView>
          ) : null}

          {activeTab === "Board" ? (
            <ThemedView style={styles.section}>
              {Object.entries(groupedIssues).map(([status, items]) => (
                <ThemedView key={status} style={styles.card}>
                  <ThemedText type="defaultSemiBold">{status}</ThemedText>
                  {items.map((issue) => (
                    <Pressable
                      key={issue.id}
                      onPress={() => handleOpenIssue(issue.id)}
                      style={styles.issueRow}
                    >
                      <ThemedText type="defaultSemiBold">
                        {issue.key}
                      </ThemedText>
                      <ThemedText>{issue.title}</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              ))}
            </ThemedView>
          ) : null}

          {activeTab === "Backlog" ? (
            <ThemedView style={styles.section}>
              {issues.map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => handleOpenIssue(issue.id)}
                  style={styles.card}
                >
                  <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
                  <ThemedText>{issue.title}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          ) : null}

          {activeTab === "Timeline" ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Timeline</ThemedText>
              <ThemedText>
                スプリントや期限情報は今後のアップデートで追加されます。
              </ThemedText>
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
              <Pressable onPress={handleCreateVersion} style={styles.primaryBtn}>
                <ThemedText type="link">Add version</ThemedText>
              </Pressable>
              {versions.map((version) => (
                <ThemedView key={version.id} style={styles.card}
                >
                  <ThemedText type="defaultSemiBold">
                    {version.name}
                  </ThemedText>
                  <ThemedText>{version.status}</ThemedText>
                </ThemedView>
              ))}
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
                          setProjectCategory(
                            value as Project["category"],
                          )
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
              <ThemedView style={styles.settingsGroup}>
                <ThemedText type="defaultSemiBold">Workflow</ThemedText>
                <ThemedText style={styles.helperText}>
                  Next statuses (comma-separated)
                </ThemedText>
                {Object.keys(WORKFLOW_TRANSITIONS).map((status) => (
                  <ThemedView key={status} style={styles.fieldGroup}>
                    <ThemedText>{status}</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="In Progress, Done"
                      value={(workflowSettings[status] ?? []).join(", ")}
                      onChangeText={(value) =>
                        setWorkflowSettings((prev) => ({
                          ...prev,
                          [status]: parseListInput(value),
                        }))
                      }
                    />
                  </ThemedView>
                ))}
              </ThemedView>
              <ThemedView style={styles.settingsGroup}>
                <ThemedText type="defaultSemiBold">
                  Notification scheme
                </ThemedText>
                <ThemedText style={styles.helperText}>
                  Recipients (comma-separated)
                </ThemedText>
                {Object.keys(DEFAULT_NOTIFICATION_SCHEME).map((eventKey) => (
                  <ThemedView key={eventKey} style={styles.fieldGroup}>
                    <ThemedText>
                      {notificationLabels[
                        eventKey as keyof typeof notificationLabels
                      ] ?? eventKey}
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Reporter, Assignee"
                      value={(notificationSettings[eventKey] ?? []).join(", ")}
                      onChangeText={(value) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          [eventKey]: parseListInput(value),
                        }))
                      }
                    />
                  </ThemedView>
                ))}
              </ThemedView>
              <Pressable onPress={handleSaveSettings} style={styles.primaryBtn}>
                <ThemedText type="link">Save settings</ThemedText>
              </Pressable>
              <Pressable onPress={handleDeleteProject} style={styles.dangerBtn}>
                <ThemedText type="link">Delete project</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}
        </>
      ) : (
        <ThemedText>Project not found.</ThemedText>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  settingsGroup: {
    gap: 12,
  },
});
