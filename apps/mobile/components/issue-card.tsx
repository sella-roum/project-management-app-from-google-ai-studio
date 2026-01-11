import { Pressable, StyleSheet } from "react-native";

import type { Issue } from "@repo/core";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@repo/core";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type IssueCardProps = {
  issue: Issue;
  onPress?: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#94a3b8",
  "In Progress": "#2563eb",
  "In Review": "#f59e0b",
  Done: "#16a34a",
};

const PRIORITY_COLORS: Record<string, string> = {
  Highest: "#b91c1c",
  High: "#f97316",
  Medium: "#2563eb",
  Low: "#64748b",
  Lowest: "#94a3b8",
};

export function IssueCard({ issue, onPress }: IssueCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ThemedView style={styles.rowBetween}>
        <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
        <ThemedView
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[issue.status] ?? "#94a3b8" },
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {STATUS_LABELS[issue.status]}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedText numberOfLines={2}>{issue.title}</ThemedText>
      <ThemedView style={styles.metaRow}>
        <ThemedText style={styles.metaBadge}>
          {TYPE_LABELS[issue.type]}
        </ThemedText>
        <ThemedView
          style={[
            styles.metaBadge,
            {
              borderColor: PRIORITY_COLORS[issue.priority] ?? "#94a3b8",
            },
          ]}
        >
          <ThemedText style={styles.metaBadgeText}>
            {PRIORITY_LABELS[issue.priority]}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    color: "#fff",
    fontSize: 11,
  },
  card: {
    borderRadius: 12,
    gap: 6,
    padding: 12,
  },
  metaBadge: {
    borderColor: "#e5e7eb",
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
