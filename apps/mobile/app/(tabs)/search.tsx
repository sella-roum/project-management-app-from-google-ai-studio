import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import type { Issue, SavedFilter } from "@repo/core";
import { executeJQL } from "@repo/core";
import {
  getCurrentUserId,
  getIssues,
  getProjects,
  getSavedFilters,
  saveFilter,
  updateSavedFilter,
  deleteSavedFilter,
} from "@repo/storage";

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IssueCard } from "@/components/issue-card";
import { useStorageReady } from "@/hooks/use-storage";

export default function SearchScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isJqlMode, setIsJqlMode] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [filterName, setFilterName] = useState("");
  const [jqlSuggestions, setJqlSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const [issueData, saved, projectData] = await Promise.all([
        getIssues(),
        getSavedFilters(),
        getProjects(),
      ]);
      setIssues(issueData);
      setSavedFilters(saved);
      setProjects(projectData.map((project) => project));
    };
    void load();
  }, [ready]);

  const reloadSavedFilters = async () => {
    const saved = await getSavedFilters();
    setSavedFilters(saved);
  };

  const filteredIssues = useMemo(() => {
    const currentUserId = getCurrentUserId();
    let results = [...issues];

    if (isJqlMode && query) {
      results = executeJQL(query, results);
    } else {
      if (activeFilter === "assigned") {
        results = results.filter((i) => i.assigneeId === currentUserId);
      }
      if (activeFilter === "reported") {
        results = results.filter((i) => i.reporterId === currentUserId);
      }
      if (filterProjectId) {
        results = results.filter((i) => i.projectId === filterProjectId);
      }
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.key.toLowerCase().includes(q),
        );
      }
    }

    return results;
  }, [issues, isJqlMode, query, activeFilter, filterProjectId]);

  const recentIssues = useMemo(
    () =>
      [...issues]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [issues],
  );

  const recommendedIssues = useMemo(() => {
    const currentUserId = getCurrentUserId();
    const overdue = issues.filter(
      (issue) =>
        issue.dueDate &&
        issue.status !== "Done" &&
        new Date(issue.dueDate).getTime() < Date.now(),
    );
    const assigned = issues.filter(
      (issue) => issue.assigneeId === currentUserId && issue.status !== "Done",
    );
    const open = issues.filter((issue) => issue.status !== "Done");
    return {
      overdue: overdue.slice(0, 3),
      assigned: assigned.slice(0, 3),
      open: open.slice(0, 3),
    };
  }, [issues]);

  const handleSaveFilter = async () => {
    if (!filterName) return;
    let finalQuery = query;
    if (!isJqlMode && activeFilter) {
      const uid = getCurrentUserId();
      finalQuery =
        activeFilter === "assigned"
          ? `assigneeId = ${uid}`
          : `reporterId = ${uid}`;
    }
    await saveFilter(filterName, finalQuery, undefined, isJqlMode);
    await reloadSavedFilters();
    setFilterName("");
    setActiveTab("saved");
    setSaveModalOpen(false);
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    await updateSavedFilter(id, { isFavorite: !isFavorite });
    await reloadSavedFilters();
  };

  const handleDeleteFilter = async (id: string) => {
    await deleteSavedFilter(id);
    await reloadSavedFilters();
  };

  const JQL_FIELDS = [
    "status",
    "priority",
    "type",
    "assigneeId",
    "reporterId",
    "createdAt",
    "dueDate",
  ];

  const handleJqlChange = (value: string) => {
    setQuery(value);
    const words = value.split(" ");
    const lastWord = words[words.length - 1].toLowerCase();
    if (lastWord.length > 0) {
      const fieldMatches = JQL_FIELDS.filter((field) =>
        field.startsWith(lastWord),
      );
      setJqlSuggestions(fieldMatches);
    } else {
      setJqlSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const words = query.split(" ");
    words[words.length - 1] = suggestion;
    setQuery(`${words.join(" ")} `);
    setJqlSuggestions([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Search</ThemedText>
      {activeTab === "all" && !isJqlMode ? (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">最近</ThemedText>
          {!ready ? (
            <Skeleton height={48} />
          ) : recentIssues.length === 0 ? (
            <EmptyState title="最近の課題はありません。" />
          ) : (
            recentIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onPress={() => router.push(`/issue/${issue.id}`)}
              />
            ))
          )}
          <ThemedText type="subtitle">保存済み</ThemedText>
          {!ready ? (
            <Skeleton height={32} />
          ) : savedFilters.length === 0 ? (
            <EmptyState title="保存済みフィルタはありません。" />
          ) : (
            savedFilters.slice(0, 3).map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => {
                  setIsJqlMode(filter.isJqlMode);
                  setQuery(filter.query);
                  setActiveTab("all");
                }}
                style={styles.savedFilterChip}
              >
                <ThemedText>{filter.name}</ThemedText>
              </Pressable>
            ))
          )}
          <ThemedText type="subtitle">おすすめ</ThemedText>
          <ThemedView style={styles.recommendationGroup}>
            <ThemedText style={styles.metaText}>期限切れ</ThemedText>
            {recommendedIssues.overdue.length === 0 ? (
              <ThemedText style={styles.metaText}>
                期限切れの課題はありません。
              </ThemedText>
            ) : (
              recommendedIssues.overdue.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                />
              ))
            )}
            <ThemedText style={styles.metaText}>自分の担当</ThemedText>
            {recommendedIssues.assigned.length === 0 ? (
              <ThemedText style={styles.metaText}>
                担当中の課題はありません。
              </ThemedText>
            ) : (
              recommendedIssues.assigned.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                />
              ))
            )}
            <ThemedText style={styles.metaText}>未完了</ThemedText>
            {recommendedIssues.open.length === 0 ? (
              <ThemedText style={styles.metaText}>
                未完了の課題はありません。
              </ThemedText>
            ) : (
              recommendedIssues.open.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                />
              ))
            )}
          </ThemedView>
        </ThemedView>
      ) : null}
      <ThemedView style={styles.tabRow}>
        <Pressable
          onPress={() => setIsJqlMode(false)}
          style={[styles.tab, !isJqlMode && styles.tabActive]}
        >
          <ThemedText>ベーシック</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setIsJqlMode(true)}
          style={[styles.tab, isJqlMode && styles.tabActive]}
        >
          <ThemedText>JQL</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab(activeTab === "all" ? "saved" : "all")}
          style={styles.tab}
        >
          <ThemedText>
            {activeTab === "saved" ? "検索に戻る" : "保存済み"}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {isJqlMode ? (
        <ThemedView style={styles.section}>
          <TextInput
            style={styles.textArea}
            placeholder="status = Done AND priority = Highest"
            value={query}
            onChangeText={handleJqlChange}
            multiline
          />
          {jqlSuggestions.length > 0 ? (
            <ThemedView style={styles.suggestions}>
              {jqlSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => applySuggestion(suggestion)}
                >
                  <ThemedText>{suggestion}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          ) : null}
          <Pressable
            onPress={() => setSaveModalOpen(true)}
            style={styles.primaryButton}
          >
            <ThemedText type="link">この検索を保存</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="課題キー、タイトルを検索..."
            value={query}
            onChangeText={setQuery}
          />
          {activeFilter || filterProjectId || query ? (
            <ThemedView style={styles.chipRow}>
              {query ? (
                <Pressable onPress={() => setQuery("")} style={styles.chip}>
                  <ThemedText>検索中: {query}</ThemedText>
                </Pressable>
              ) : null}
              {activeFilter ? (
                <Pressable
                  onPress={() => setActiveFilter(null)}
                  style={styles.chip}
                >
                  <ThemedText>
                    {activeFilter === "assigned" ? "自分の担当" : "報告済み"}
                  </ThemedText>
                </Pressable>
              ) : null}
              {filterProjectId ? (
                <Pressable
                  onPress={() => setFilterProjectId("")}
                  style={styles.chip}
                >
                  <ThemedText>
                    {projects.find((project) => project.id === filterProjectId)
                      ?.name ?? "プロジェクト"}
                  </ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          ) : null}
          <ThemedView style={styles.filterRow}>
            <Pressable
              onPress={() => setShowAdvanced((prev) => !prev)}
              style={[
                styles.filterButton,
                showAdvanced && styles.filterActive,
              ]}
            >
              <ThemedText>詳細</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("assigned")}
              style={[
                styles.filterButton,
                activeFilter === "assigned" && styles.filterActive,
              ]}
            >
              <ThemedText>Assigned</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("reported")}
              style={[
                styles.filterButton,
                activeFilter === "reported" && styles.filterActive,
              ]}
            >
              <ThemedText>Reported</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter(null)}
              style={styles.filterButton}
            >
              <ThemedText>Clear</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setSaveModalOpen(true)}
              style={styles.filterButton}
            >
              <ThemedText>保存</ThemedText>
            </Pressable>
          </ThemedView>
          {showAdvanced ? (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Project</ThemedText>
              <Pressable
                onPress={() => setFilterProjectId("")}
                style={[
                  styles.filterButton,
                  filterProjectId === "" && styles.filterActive,
                ]}
              >
                <ThemedText>すべてのプロジェクト</ThemedText>
              </Pressable>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => setFilterProjectId(project.id)}
                  style={[
                    styles.filterButton,
                    filterProjectId === project.id && styles.filterActive,
                  ]}
                >
                  <ThemedText>{project.name}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          ) : null}
        </ThemedView>
      )}

      {activeTab === "saved" ? (
        <ThemedView style={styles.section}>
          {savedFilters.length === 0 ? (
            <ThemedText>保存済みフィルタはありません。</ThemedText>
          ) : (
            savedFilters.map((filter) => (
              <ThemedView key={filter.id} style={styles.card}>
                <Pressable
                  onPress={() => {
                    setIsJqlMode(filter.isJqlMode);
                    setQuery(filter.query);
                    setActiveTab("all");
                  }}
                >
                  <ThemedText type="defaultSemiBold">{filter.name}</ThemedText>
                  <ThemedText>{filter.query}</ThemedText>
                </Pressable>
                <ThemedView style={styles.savedFilterActions}>
                  <Pressable
                    onPress={() =>
                      handleToggleFavorite(filter.id, filter.isFavorite)
                    }
                    style={[
                      styles.savedFilterAction,
                      filter.isFavorite && styles.savedFilterActionActive,
                    ]}
                  >
                    <ThemedText>
                      {filter.isFavorite ? "★ お気に入り" : "☆ お気に入り"}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteFilter(filter.id)}
                    style={[styles.savedFilterAction, styles.savedFilterDelete]}
                  >
                    <ThemedText>削除</ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.metaText}>
            結果: {filteredIssues.length}件
          </ThemedText>
          {!ready ? (
            <Skeleton height={48} />
          ) : filteredIssues.length === 0 ? (
            <EmptyState title="一致する課題がありません。" />
          ) : (
            filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onPress={() => router.push(`/issue/${issue.id}`)}
              />
            ))
          )}
        </ThemedView>
      )}

      <Modal
        transparent
        visible={saveModalOpen}
        onRequestClose={() => setSaveModalOpen(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="subtitle">保存済みフィルタ</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="保存名"
              value={filterName}
              onChangeText={setFilterName}
            />
            <ThemedView style={styles.rowBetween}>
              <Pressable
                onPress={() => setSaveModalOpen(false)}
                style={styles.secondaryButton}
              >
                <ThemedText>キャンセル</ThemedText>
              </Pressable>
              <Pressable onPress={handleSaveFilter} style={styles.primaryButton}>
                <ThemedText type="link">保存</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  chip: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterActive: {
    borderColor: "#2563eb",
  },
  filterButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterRow: {
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    minHeight: 44,
    paddingVertical: 10,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recommendationGroup: {
    gap: 8,
  },
  savedFilterChip: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
  section: {
    gap: 12,
  },
  savedFilterAction: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedFilterActionActive: {
    borderColor: "#2563eb",
  },
  savedFilterActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  savedFilterDelete: {
    borderColor: "#fca5a5",
  },
  suggestions: {
    gap: 6,
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
    flexWrap: "wrap",
    gap: 8,
  },
  textArea: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
