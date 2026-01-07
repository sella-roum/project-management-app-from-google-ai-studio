import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import type { Issue, Project } from "@repo/core";
import { getIssues, getProjectById } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function ProjectViewScreen() {
  const ready = useStorageReady();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const normalizedProjectId = useMemo(
    () => (Array.isArray(projectId) ? projectId[0] : projectId),
    [projectId],
  );
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (!ready || !normalizedProjectId) return;
    const load = async () => {
      const [projectData, issueData] = await Promise.all([
        getProjectById(normalizedProjectId),
        getIssues(normalizedProjectId),
      ]);
      setProject(projectData);
      setIssues(issueData);
    };
    void load();
  }, [ready, normalizedProjectId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Project</ThemedText>
      {!ready ? (
        <ThemedText>Loading project...</ThemedText>
      ) : project ? (
        <>
          <ThemedText type="subtitle">{project.name}</ThemedText>
          <ThemedText>{project.key}</ThemedText>
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">Issues</ThemedText>
            {issues.length === 0 ? (
              <ThemedText>No issues yet.</ThemedText>
            ) : (
              issues.slice(0, 5).map((issue) => (
                <ThemedView key={issue.id} style={styles.issueRow}>
                  <ThemedText type="defaultSemiBold">
                    {issue.key}
                  </ThemedText>
                  <ThemedText>{issue.title}</ThemedText>
                  <ThemedText>{issue.status}</ThemedText>
                </ThemedView>
              ))
            )}
          </ThemedView>
        </>
      ) : (
        <ThemedText>Project not found.</ThemedText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    gap: 10,
    padding: 16,
  },
  container: {
    gap: 16,
    padding: 24,
  },
  issueRow: {
    gap: 4,
  },
});
