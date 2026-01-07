import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ProjectViewScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Project</ThemedText>
      <ThemedText type="subtitle">
        ProjectView shell for {projectId ?? "unknown"}
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Overview</ThemedText>
        <ThemedText>Key milestones, tasks, and team members.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Timeline</ThemedText>
        <ThemedText>Upcoming deadlines and status updates.</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
});
