import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const textOnBrand = useThemeColor({}, "textOnBrand");
  const textTertiary = useThemeColor({}, "textTertiary");

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.icon}>✨</ThemedText>
      <ThemedText type="subtitle">{title}</ThemedText>
      {description ? (
        <ThemedText style={[styles.text, { color: textTertiary }]}>
          {description}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={[styles.button, { backgroundColor: brandPrimary }]}
        >
          <ThemedText style={[styles.buttonText, { color: textOnBrand }]}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
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
    textAlign: "center",
  },
});
