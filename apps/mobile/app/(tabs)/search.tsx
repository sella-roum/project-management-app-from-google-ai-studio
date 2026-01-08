import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import type { Issue } from "@repo/core";
import { executeJQL } from "@repo/core";
import {
  getCurrentUserId,
  getIssues,
  getProjects,
  getSavedFilters,
  saveFilter,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function SearchScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isJqlMode, setIsJqlMode] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");
  const [savedFilters, setSavedFilters] = useState<
    { id: string; name: string; query: string }[]
  >([]);
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
    await saveFilter(filterName, finalQuery);
    const saved = await getSavedFilters();
    setSavedFilters(saved);
    setFilterName("");
    setActiveTab("saved");
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
          <Pressable onPress={handleSaveFilter} style={styles.primaryButton}>
            <ThemedText type="link">この検索を保存</ThemedText>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="保存名"
            value={filterName}
            onChangeText={setFilterName}
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="課題キー、タイトルを検索..."
            value={query}
            onChangeText={setQuery}
          />
          <ThemedView style={styles.filterRow}>
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
          </ThemedView>
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Project</ThemedText>
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
        </ThemedView>
      )}

      {activeTab === "saved" ? (
        <ThemedView style={styles.section}>
          {savedFilters.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => {
                setIsJqlMode(true);
                setQuery(filter.query);
                setActiveTab("all");
              }}
              style={styles.card}
            >
              <ThemedText type="defaultSemiBold">{filter.name}</ThemedText>
              <ThemedText>{filter.query}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          {filteredIssues.map((issue) => (
            <Pressable
              key={issue.id}
              onPress={() => router.push(`/issue/${issue.id}`)}
              style={styles.card}
            >
              <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
              <ThemedText>{issue.title}</ThemedText>
              <ThemedText>{issue.status}</ThemedText>
            </Pressable>
          ))}
          {!ready ? <ThemedText>Loading...</ThemedText> : null}
          {ready && filteredIssues.length === 0 ? (
            <ThemedText>No matches.</ThemedText>
          ) : null}
        </ThemedView>
      )}
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
  card: {
    borderRadius: 12,
    gap: 4,
    padding: 12,
  },
  filterActive: {
    borderColor: "#2563eb",
  },
  filterButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
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
    paddingVertical: 10,
  },
  section: {
    gap: 12,
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
