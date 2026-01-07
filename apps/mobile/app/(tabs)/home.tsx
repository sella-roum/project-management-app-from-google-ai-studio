import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { getIssues, getProjects, getUnreadMentionCount } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function HomeScreen() {
  const ready = useStorageReady();
  const [projectCount, setProjectCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const [projects, issues, unread] = await Promise.all([
        getProjects(),
        getIssues(),
        getUnreadMentionCount(),
      ]);
      setProjectCount(projects.length);
      setIssueCount(issues.length);
      setUnreadCount(unread);
    };
    void load();
  }, [ready]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      {!ready ? (
        <ThemedText>Preparing your workspace...</ThemedText>
      ) : (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Overview</ThemedText>
          <ThemedText>{projectCount} active projects</ThemedText>
          <ThemedText>{issueCount} total issues</ThemedText>
          <ThemedText>{unreadCount} unread notifications</ThemedText>
        </ThemedView>
      )}
      <Link href="/(tabs)/projects">
        <ThemedText type="link">Browse projects</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  container: {
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
