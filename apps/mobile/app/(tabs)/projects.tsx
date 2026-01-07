import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ProjectsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Projects</ThemedText>
      <ThemedText>Track active projects and deadlines.</ThemedText>
      <Link href="/project/roadmap">
        <ThemedText type="link">View Roadmap project</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
