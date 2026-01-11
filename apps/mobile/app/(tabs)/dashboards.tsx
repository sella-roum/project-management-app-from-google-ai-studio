import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { Issue, Project } from "@repo/core";
import { STATUS_LABELS } from "@repo/core";
import { getCurrentUserId, getIssues, getProjects } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

const CHART_COLORS = ["#0052CC", "#36B37E", "#FFAB00", "#FF5630", "#00B8D9"];

export default function DashboardsScreen() {
  const ready = useStorageReady();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeGadgetIds, setActiveGadgetIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const load = async () => {
      const [issueData, projectData] = await Promise.all([
        getIssues(),
        getProjects(),
      ]);
      if (!active) return;
      setIssues(issueData);
      setProjects(projectData);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const loadConfig = async () => {
      const userId = getCurrentUserId();
      const stored = await AsyncStorage.getItem(
        `dashboard_gadgets_${userId}`,
      );
      if (!active) return;
      if (stored) {
        setActiveGadgetIds(JSON.parse(stored));
      } else {
        setActiveGadgetIds(["status", "progress", "bugs"]);
      }
      setInitialized(true);
    };
    void loadConfig();
    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!initialized) return;
    const userId = getCurrentUserId();
    void AsyncStorage.setItem(
      `dashboard_gadgets_${userId}`,
      JSON.stringify(activeGadgetIds),
    );
  }, [activeGadgetIds, initialized]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      label: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      value,
    }));
  }, [issues]);

  const totalStatusCount = useMemo(
    () => statusData.reduce((sum, item) => sum + item.value, 0),
    [statusData],
  );

  const projectData = useMemo(() => {
    return projects.map((project) => {
      const projectIssues = issues.filter((i) => i.projectId === project.id);
      const doneCount = projectIssues.filter((i) => i.status === "Done").length;
      return {
        key: project.key,
        total: projectIssues.length,
        done: doneCount,
      };
    });
  }, [issues, projects]);

  const availableGadgets = [
    { id: "status", title: "ステータス分布" },
    { id: "progress", title: "プロジェクト別進捗" },
    { id: "bugs", title: "最近のバグ" },
    { id: "due", title: "期限切れ間近" },
  ];

  const removeGadget = (id: string) => {
    setActiveGadgetIds((prev) => prev.filter((item) => item !== id));
  };

  const addGadget = (id: string) => {
    if (!activeGadgetIds.includes(id)) {
      setActiveGadgetIds((prev) => [...prev, id]);
    }
    setShowAddModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title">Dashboards</ThemedText>
          <ThemedText style={styles.subtleText}>
            プロジェクトの概況を確認できます。
          </ThemedText>
        </ThemedView>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.secondaryButton}>
          <ThemedText>ガジェット追加</ThemedText>
        </Pressable>
      </ThemedView>

      {activeGadgetIds.map((id) => (
        <ThemedView key={id} style={styles.card}>
          <ThemedView style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold">
              {availableGadgets.find((g) => g.id === id)?.title ?? id}
            </ThemedText>
            <Pressable onPress={() => removeGadget(id)} style={styles.ghostButton}>
              <ThemedText>削除</ThemedText>
            </Pressable>
          </ThemedView>
          {id === "status" ? (
            <ThemedView style={styles.section}>
              {statusData.length === 0 ? (
                <ThemedText style={styles.subtleText}>データがありません。</ThemedText>
              ) : (
                <>
                  <ThemedView style={styles.pieBar}>
                    {statusData.map((item, index) => {
                      const percent =
                        totalStatusCount > 0
                          ? (item.value / totalStatusCount) * 100
                          : 0;
                      return (
                        <ThemedView
                          key={item.label}
                          style={[
                            styles.pieSegment,
                            {
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                              width: `${percent}%`,
                            },
                          ]}
                        />
                      );
                    })}
                  </ThemedView>
                  {statusData.map((item, index) => (
                    <ThemedView key={item.label} style={styles.rowBetween}>
                      <ThemedView style={styles.row}>
                        <ThemedView
                          style={[
                            styles.legendDot,
                            {
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            },
                          ]}
                        />
                        <ThemedText>{item.label}</ThemedText>
                      </ThemedView>
                      <ThemedText>{item.value}</ThemedText>
                    </ThemedView>
                  ))}
                </>
              )}
            </ThemedView>
          ) : null}
          {id === "progress" ? (
            <ThemedView style={styles.section}>
              {projectData.length === 0 ? (
                <ThemedText style={styles.subtleText}>プロジェクトがありません。</ThemedText>
              ) : (
                projectData.map((project) => {
                  const percent =
                    project.total > 0
                      ? Math.round((project.done / project.total) * 100)
                      : 0;
                  return (
                    <ThemedView key={project.key} style={styles.progressRow}>
                      <ThemedView style={styles.rowBetween}>
                        <ThemedText>{project.key}</ThemedText>
                        <ThemedText>
                          {project.done} / {project.total}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.progressTrack}>
                        <ThemedView
                          style={[
                            styles.progressFill,
                            { width: `${percent}%` },
                          ]}
                        />
                      </ThemedView>
                    </ThemedView>
                  );
                })
              )}
            </ThemedView>
          ) : null}
          {id === "bugs" ? (
            <ThemedView style={styles.section}>
              {issues.filter((issue) => issue.type === "Bug").slice(0, 4).map((bug) => (
                <ThemedView key={bug.id} style={styles.rowBetween}>
                  <ThemedText numberOfLines={1}>{bug.title}</ThemedText>
                  <ThemedText style={styles.metaText}>{bug.key}</ThemedText>
                </ThemedView>
              ))}
              {issues.filter((issue) => issue.type === "Bug").length === 0 ? (
                <ThemedText style={styles.subtleText}>最近のバグはありません。</ThemedText>
              ) : null}
            </ThemedView>
          ) : null}
          {id === "due" ? (
            <ThemedView style={styles.section}>
              {issues
                .filter((issue) => issue.dueDate && issue.status !== "Done")
                .slice(0, 4)
                .map((issue) => (
                  <ThemedView key={issue.id} style={styles.rowBetween}>
                    <ThemedText numberOfLines={1}>{issue.title}</ThemedText>
                    <ThemedText style={styles.warningBadge}>
                      {new Date(issue.dueDate!).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                ))}
              {issues.filter((issue) => issue.dueDate && issue.status !== "Done")
                .length === 0 ? (
                <ThemedText style={styles.subtleText}>期限情報はありません。</ThemedText>
              ) : null}
            </ThemedView>
          ) : null}
        </ThemedView>
      ))}

      {showAddModal ? (
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedView style={styles.rowBetween}>
              <ThemedText type="subtitle">ガジェットを追加</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <ThemedText>閉じる</ThemedText>
              </Pressable>
            </ThemedView>
            {availableGadgets.map((gadget) => {
              const isActive = activeGadgetIds.includes(gadget.id);
              return (
                <Pressable
                  key={gadget.id}
                  onPress={() => addGadget(gadget.id)}
                  disabled={isActive}
                  style={[styles.option, isActive && styles.optionDisabled]}
                >
                  <ThemedText type="defaultSemiBold">{gadget.title}</ThemedText>
                  {isActive ? (
                    <ThemedText style={styles.subtleText}>追加済み</ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </ThemedView>
        </ThemedView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    gap: 16,
    padding: 24,
  },
  ghostButton: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: "#6b7280",
    fontSize: 12,
  },
  modalCard: {
    borderRadius: 16,
    gap: 12,
    padding: 16,
  },
  modalOverlay: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 24,
    position: "absolute",
    right: 0,
    top: 0,
  },
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  progressFill: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    height: 6,
  },
  progressRow: {
    gap: 6,
  },
  progressTrack: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 6,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    gap: 8,
  },
  secondaryButton: {
    borderColor: "#2563eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subtleText: {
    color: "#6b7280",
    fontSize: 12,
  },
  warningBadge: {
    backgroundColor: "#ffedd5",
    borderRadius: 999,
    color: "#c2410c",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  pieBar: {
    borderRadius: 999,
    flexDirection: "row",
    height: 10,
    overflow: "hidden",
  },
  pieSegment: {
    height: 10,
  },
});
