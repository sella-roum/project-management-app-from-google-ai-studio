import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
import { SearchSortRow, type SortOption, type SortKey } from "@/components/search-sort-row";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IssueCard } from "@/components/issue-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  const [sortKey, setSortKey] = useState<SortKey>(
    "updated",
  );
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const metaTextColor = useThemeColor({}, "textSecondary");
  const errorBorder = useThemeColor({}, "stateErrorText");
  const modalOverlayColor = useThemeColor({}, "surfaceOverlay");
  const activeBg = useThemeColor({}, "stateInfoBg");
  const activeBorder = useThemeColor({}, "brandPrimary");
  const activeText = useThemeColor({}, "stateInfoText");
  const inactiveText = useThemeColor({}, "textSecondary");

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
      setProjects(projectData);
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

    const priorityOrder = ["Highest", "High", "Medium", "Low", "Lowest"];
    const sorted = [...results].sort((a, b) => {
      if (sortKey === "created") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortKey === "priority") {
        const aIndex = priorityOrder.indexOf(a.priority);
        const bIndex = priorityOrder.indexOf(b.priority);
        return (
          (aIndex === -1 ? priorityOrder.length : aIndex) -
          (bIndex === -1 ? priorityOrder.length : bIndex)
        );
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return sorted;
  }, [issues, isJqlMode, query, activeFilter, filterProjectId, sortKey]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [filteredIssues.length, activeTab, isJqlMode]);

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
  const sortOptions: SortOption[] = [
    { key: "updated", label: "更新日" },
    { key: "created", label: "作成日" },
    { key: "priority", label: "優先度" },
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
          <ThemedView style={styles.quickAccess}>
            <ThemedView style={styles.quickSection}>
              <ThemedText type="headline">直近の検索</ThemedText>
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
            </ThemedView>
            <ThemedView style={styles.quickSection}>
              <ThemedText type="headline">保存済みフィルタ</ThemedText>
              {!ready ? (
                <Skeleton height={32} />
              ) : savedFilters.length === 0 ? (
                <EmptyState title="保存済みフィルタはありません。" />
              ) : (
                <ThemedView style={styles.savedFilterRow}>
                  {savedFilters.slice(0, 3).map((filter) => (
                    <Pressable
                      key={filter.id}
                      onPress={() => {
                        setIsJqlMode(filter.isJqlMode);
                        setQuery(filter.query);
                        setActiveTab("all");
                      }}
                    >
                      <Chip label={filter.name} style={styles.savedFilterChip} />
                    </Pressable>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
          <ThemedText type="headline">おすすめ</ThemedText>
          <ThemedView style={styles.recommendationGroup}>
            <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
              期限切れ
            </ThemedText>
            {recommendedIssues.overdue.length === 0 ? (
              <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
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
            <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
              自分の担当
            </ThemedText>
            {recommendedIssues.assigned.length === 0 ? (
              <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
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
            <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
              未完了
            </ThemedText>
            {recommendedIssues.open.length === 0 ? (
              <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
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
          style={[
            styles.tab,
            { borderColor: borderSubtle },
            !isJqlMode && { borderColor: activeBorder, backgroundColor: activeBg },
          ]}
        >
          <ThemedText type="body">ベーシック</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setIsJqlMode(true)}
          style={[
            styles.tab,
            { borderColor: borderSubtle },
            isJqlMode && { borderColor: activeBorder, backgroundColor: activeBg },
          ]}
        >
          <ThemedText type="body">JQL</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab(activeTab === "all" ? "saved" : "all")}
          style={[styles.tab, { borderColor: borderSubtle }]}
        >
          <ThemedText type="body">
            {activeTab === "saved" ? "検索に戻る" : "保存済み"}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {isJqlMode ? (
        <ThemedView style={styles.section}>
          <Input
            placeholder="status = Done AND priority = Highest"
            value={query}
            onChangeText={handleJqlChange}
            multiline
            style={styles.textArea}
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
          <SearchSortRow
            sortKey={sortKey}
            sortOptions={sortOptions}
            onSortChange={setSortKey}
          />
          <Button label="この検索を保存" onPress={() => setSaveModalOpen(true)} />
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <Input
            placeholder="課題キー、タイトルを検索..."
            value={query}
            onChangeText={setQuery}
          />
          {activeFilter || filterProjectId || query ? (
            <ThemedView style={styles.chipRow}>
              {query ? (
                <Pressable onPress={() => setQuery("")}>
                  <Chip label={`検索中: ${query}`} style={styles.chip} />
                </Pressable>
              ) : null}
              {activeFilter ? (
                <Pressable
                  onPress={() => setActiveFilter(null)}
                >
                  <Chip
                    label={activeFilter === "assigned" ? "自分の担当" : "報告済み"}
                    style={styles.chip}
                  />
                </Pressable>
              ) : null}
              {filterProjectId ? (
                <Pressable
                  onPress={() => setFilterProjectId("")}
                >
                  <Chip
                    label={
                      projects.find((project) => project.id === filterProjectId)
                        ?.name ?? "プロジェクト"
                    }
                    style={styles.chip}
                  />
                </Pressable>
              ) : null}
            </ThemedView>
          ) : null}
          <ThemedView style={styles.filterRow}>
            <Pressable
              onPress={() => setShowAdvanced((prev) => !prev)}
              style={[
                styles.filterButton,
                { borderColor: borderSubtle },
                showAdvanced && { borderColor: activeBorder, backgroundColor: activeBg },
              ]}
            >
              <View style={styles.chipContent}>
                {showAdvanced ? (
                  <MaterialIcons name="check" size={16} color={activeText} />
                ) : null}
                <ThemedText type="body" style={{ color: showAdvanced ? activeText : inactiveText }}>
                  詳細
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("assigned")}
              style={[
                styles.filterButton,
                { borderColor: borderSubtle },
                activeFilter === "assigned" && {
                  borderColor: activeBorder,
                  backgroundColor: activeBg,
                },
              ]}
            >
              <View style={styles.chipContent}>
                {activeFilter === "assigned" ? (
                  <MaterialIcons name="check" size={16} color={activeText} />
                ) : null}
                <ThemedText
                  type="body"
                  style={{
                    color: activeFilter === "assigned" ? activeText : inactiveText,
                  }}
                >
                  担当中
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("reported")}
              style={[
                styles.filterButton,
                { borderColor: borderSubtle },
                activeFilter === "reported" && {
                  borderColor: activeBorder,
                  backgroundColor: activeBg,
                },
              ]}
            >
              <View style={styles.chipContent}>
                {activeFilter === "reported" ? (
                  <MaterialIcons name="check" size={16} color={activeText} />
                ) : null}
                <ThemedText
                  type="body"
                  style={{
                    color: activeFilter === "reported" ? activeText : inactiveText,
                  }}
                >
                  報告済み
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter(null)}
              style={[styles.filterButton, { borderColor: borderSubtle }]}
            >
              <ThemedText type="body">クリア</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setSaveModalOpen(true)}
              style={[styles.filterButton, { borderColor: borderSubtle }]}
            >
              <ThemedText type="body">保存</ThemedText>
            </Pressable>
          </ThemedView>
          {showAdvanced ? (
            <ThemedView style={styles.section}>
              <ThemedText type="headline">プロジェクト</ThemedText>
              <Pressable
                onPress={() => setFilterProjectId("")}
                style={[
                  styles.filterButton,
                  { borderColor: borderSubtle },
                  filterProjectId === "" && {
                    borderColor: activeBorder,
                    backgroundColor: activeBg,
                  },
                ]}
              >
                <View style={styles.chipContent}>
                  {filterProjectId === "" ? (
                    <MaterialIcons name="check" size={16} color={activeText} />
                  ) : null}
                  <ThemedText
                    type="body"
                    style={{
                      color: filterProjectId === "" ? activeText : inactiveText,
                    }}
                  >
                    すべてのプロジェクト
                  </ThemedText>
                </View>
              </Pressable>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => setFilterProjectId(project.id)}
                  style={[
                    styles.filterButton,
                    { borderColor: borderSubtle },
                    filterProjectId === project.id && {
                      borderColor: activeBorder,
                      backgroundColor: activeBg,
                    },
                  ]}
                >
                  <View style={styles.chipContent}>
                    {filterProjectId === project.id ? (
                      <MaterialIcons name="check" size={16} color={activeText} />
                    ) : null}
                    <ThemedText
                      type="body"
                      style={{
                        color: filterProjectId === project.id ? activeText : inactiveText,
                      }}
                    >
                      {project.name}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ThemedView>
          ) : null}
          <SearchSortRow
            sortKey={sortKey}
            sortOptions={sortOptions}
            onSortChange={setSortKey}
          />
        </ThemedView>
      )}

      {activeTab === "saved" ? (
        <ThemedView style={styles.section}>
          {savedFilters.length === 0 ? (
            <ThemedText type="body">保存済みフィルタはありません。</ThemedText>
          ) : (
            savedFilters.map((filter) => (
              <ThemedView
                key={filter.id}
                style={[
                  styles.card,
                  { backgroundColor: surfaceRaised, borderColor: borderSubtle },
                ]}
              >
                <Pressable
                  onPress={() => {
                    setIsJqlMode(filter.isJqlMode);
                    setQuery(filter.query);
                    setActiveTab("all");
                  }}
                >
                  <ThemedText type="bodySemiBold">{filter.name}</ThemedText>
                  <ThemedText type="caption">{filter.query}</ThemedText>
                </Pressable>
                <ThemedView style={styles.savedFilterActions}>
                  <Pressable
                    onPress={() =>
                      handleToggleFavorite(filter.id, filter.isFavorite)
                    }
                    style={[
                      styles.savedFilterAction,
                      { borderColor: borderSubtle },
                      filter.isFavorite && {
                        borderColor: activeBorder,
                        backgroundColor: activeBg,
                      },
                    ]}
                  >
                    <ThemedText type="body">
                      {filter.isFavorite ? "★ お気に入り" : "☆ お気に入り"}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteFilter(filter.id)}
                    style={[
                      styles.savedFilterAction,
                      { borderColor: errorBorder },
                    ]}
                  >
                    <ThemedText type="body">削除</ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
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
          <View style={[styles.modalBackdrop, { backgroundColor: modalOverlayColor }]} />
          <ThemedView style={[styles.modalCard, { backgroundColor: surfaceRaised }]}>
            <ThemedText type="headline">保存済みフィルタ</ThemedText>
            <Input
              placeholder="保存名"
              value={filterName}
              onChangeText={setFilterName}
            />
            <ThemedView style={styles.rowBetween}>
              <Button
                label="キャンセル"
                onPress={() => setSaveModalOpen(false)}
                variant="secondary"
              />
              <Button label="保存" onPress={handleSaveFilter} />
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
    gap: Spacing.l,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  chip: {
    borderRadius: Radius.l,
  },
  chipContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  filterButton: {
    borderRadius: Radius.m,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.s,
  },
  recommendationGroup: {
    gap: Spacing.s,
  },
  savedFilterChip: {
    borderRadius: Radius.l,
  },
  metaText: {
    fontSize: 12,
  },
  modalCard: {
    borderRadius: Radius.l,
    gap: Spacing.m,
    padding: Spacing.l,
    ...Elevation.medium,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalOverlay: {
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: Spacing.xl,
    position: "absolute",
    right: 0,
    top: 0,
  },
  quickAccess: {
    gap: Spacing.l,
  },
  quickSection: {
    gap: Spacing.s,
  },
  section: {
    gap: Spacing.m,
  },
  savedFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  savedFilterAction: {
    borderRadius: Radius.l,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  savedFilterActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  suggestions: {
    gap: Spacing.s,
  },
  tab: {
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  textArea: {
    borderRadius: Radius.m,
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  card: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.s,
    padding: Spacing.l,
  },
});
