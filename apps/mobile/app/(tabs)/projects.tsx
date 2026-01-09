import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { CATEGORY_LABELS } from "@repo/core";
import { getProjects, toggleProjectStar } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStorageReady } from "@/hooks/use-storage";

type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  type: "Scrum" | "Kanban";
  category?: "Software" | "Business";
  description?: string;
  iconUrl?: string;
  starred?: boolean;
};

export default function ProjectsScreen() {
  const ready = useStorageReady();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const data = await getProjects();
      setProjects(
        data.map((project) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          type: project.type,
          category: project.category,
          description: project.description,
          iconUrl: project.iconUrl,
          starred: project.starred,
        })),
      );
    };
    void load();
  }, [ready]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (a.starred === b.starred) return a.name.localeCompare(b.name);
      return a.starred ? -1 : 1;
    });
  }, [projects]);

  const handleToggleStar = async (projectId: string) => {
    await toggleProjectStar(projectId);
    const data = await getProjects();
    setProjects(
      data.map((project) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        type: project.type,
        category: project.category,
        description: project.description,
        iconUrl: project.iconUrl,
        starred: project.starred,
      })),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Projects</ThemedText>
        <Link href={{ pathname: "/modal", params: { mode: "project" } }}>
          <ThemedText type="link">Create project</ThemedText>
        </Link>
      </ThemedView>
      {!ready ? (
        <ThemedText>Loading projects...</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {sortedProjects.length === 0 ? (
            <ThemedText>No projects yet.</ThemedText>
          ) : (
            sortedProjects.map((project) => (
              <ThemedView key={project.id} style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedView style={styles.cardTitleRow}>
                    <ThemedText style={styles.iconBadge}>
                      {project.iconUrl || "PJ"}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {project.name}
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    onPress={() => handleToggleStar(project.id)}
                    style={styles.starButton}
                  >
                    <IconSymbol
                      size={20}
                      name={project.starred ? "star.fill" : "star"}
                      color={project.starred ? "#f59e0b" : "#9ca3af"}
                    />
                  </Pressable>
                </ThemedView>
                <ThemedText style={styles.metaText}>
                  {project.key} &bull; {project.type}
                </ThemedText>
                {project.description ? (
                  <ThemedText numberOfLines={2} style={styles.metaText}>
                    {project.description}
                  </ThemedText>
                ) : null}
                <ThemedText style={styles.metaText}>
                  {CATEGORY_LABELS[project.category ?? "Software"]}
                </ThemedText>
                <Link href={`/projects/${project.id}`}>
                  <ThemedText type="link">Open project</ThemedText>
                </Link>
              </ThemedView>
            ))
          )}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  container: {
    gap: 12,
    padding: 24,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  list: {
    gap: 12,
  },
  metaText: {
    color: "#6b7280",
    fontSize: 12,
  },
  starButton: {
    paddingHorizontal: 8,
  },
});
