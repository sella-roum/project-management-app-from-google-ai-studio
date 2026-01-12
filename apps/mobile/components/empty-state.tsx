import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.icon}>✨</ThemedText>
      <ThemedText type="subtitle">{title}</ThemedText>
      {description ? <ThemedText style={styles.text}>{description}</ThemedText> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.button}>
          <ThemedText type="link">{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  container: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    color: "#6b7280",
    textAlign: "center",
  },
});
