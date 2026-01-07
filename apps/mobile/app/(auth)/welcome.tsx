import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WelcomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome</ThemedText>
      <ThemedText type="subtitle">
        Manage projects, collaborate with your team, and stay on top of tasks.
      </ThemedText>
      <ThemedView style={styles.actions}>
        <Link href="/(auth)/login">
          <ThemedText type="link">Continue to login</ThemedText>
        </Link>
        <Link href="/(tabs)/home">
          <ThemedText type="link">Skip to app</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
