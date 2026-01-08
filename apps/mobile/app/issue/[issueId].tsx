import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { Issue, Project } from "@repo/core";
import { USERS, getIssueById, getProjectById, recordView } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function IssueDetailScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId: string }>();
  const normalizedIssueId = useMemo(
    () => (Array.isArray(issueId) ? issueId[0] : issueId),
    [issueId],
  );
  const [issue, setIssue] = useState<Issue | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!ready || !normalizedIssueId) return;
    let active = true;
    const load = async () => {
      const issueData = await getIssueById(normalizedIssueId);
      if (!active) return;
      setIssue(issueData);
      if (issueData?.projectId) {
        const projectData = await getProjectById(issueData.projectId);
        if (!active) return;
        setProject(projectData);
      }
      if (issueData) {
        await recordView(issueData.id);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, normalizedIssueId]);

  const assignee = useMemo(
    () => USERS.find((user) => user.id === issue?.assigneeId),
    [issue?.assigneeId],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Issue</ThemedText>
      {!ready ? (
        <ThemedText>Loading issue...</ThemedText>
      ) : !issue ? (
        <ThemedText>Issue not found.</ThemedText>
      ) : (
        <>
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
            <ThemedText>{issue.title}</ThemedText>
            <ThemedText>Status: {issue.status}</ThemedText>
            <ThemedText>Priority: {issue.priority}</ThemedText>
            <ThemedText>Type: {issue.type}</ThemedText>
            {assignee ? (
              <ThemedText>Assignee: {assignee.name}</ThemedText>
            ) : (
              <ThemedText>Assignee: Unassigned</ThemedText>
            )}
          </ThemedView>
          {project ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Project</ThemedText>
              <ThemedText>{project.name}</ThemedText>
              <ThemedText>{project.key}</ThemedText>
              <Pressable
                onPress={() => router.push(`/project/${project.id}`)}
                style={styles.linkButton}
              >
                <ThemedText type="link">Open project</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}
          {issue.description ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Description</ThemedText>
              <ThemedText>{issue.description}</ThemedText>
            </ThemedView>
          ) : null}
        </>
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
  container: {
    gap: 16,
    padding: 24,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
});
