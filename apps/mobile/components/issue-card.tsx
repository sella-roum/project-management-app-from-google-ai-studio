import { Pressable, StyleSheet } from "react-native";

import type { Issue } from "@repo/core";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@repo/core";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Chip } from "@/components/ui/chip";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  const cardBackground = useThemeColor({}, "surfaceRaised");
  const subtleBorder = useThemeColor({}, "borderSubtle");
  const mutedText = useThemeColor({}, "textSecondary");
  const textOnBrand = useThemeColor({}, "textOnBrand");
  const warningBg = useThemeColor({}, "stateWarningBg");
  const warningText = useThemeColor({}, "stateWarningText");
  const errorBg = useThemeColor({}, "stateErrorBg");
  const errorText = useThemeColor({}, "stateErrorText");
  const dueDate = issue.dueDate ? new Date(issue.dueDate) : null;
  const isOverdue =
    dueDate && issue.status !== "Done" && dueDate.getTime() < Date.now();
  const isHighPriority =
    issue.priority === "Highest" || issue.priority === "High";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: cardBackground, borderColor: subtleBorder },
      ]}
    >
      <ThemedView style={styles.rowBetween}>
        <ThemedText style={[styles.issueKey, { color: mutedText }]}>
          {issue.key}
        </ThemedText>
        <Chip
          label={STATUS_LABELS[issue.status]}
          variant="solid"
          backgroundColor={STATUS_COLORS[issue.status] ?? "#94a3b8"}
          textColor={textOnBrand}
        />
      </ThemedView>
      <ThemedText numberOfLines={2} style={styles.issueTitle}>
        {issue.title}
      </ThemedText>
      <ThemedView style={styles.metaRow}>
        <Chip label={TYPE_LABELS[issue.type]} />
        <Chip
          label={PRIORITY_LABELS[issue.priority]}
          borderColor={PRIORITY_COLORS[issue.priority] ?? "#94a3b8"}
          textColor={isHighPriority ? "#b91c1c" : undefined}
        />
        {dueDate ? (
          <Chip
            label={dueDate.toLocaleDateString()}
            borderColor={warningBg}
            textColor={warningText}
          />
        ) : null}
        {isOverdue ? (
          <Chip
            label="期限切れ"
            variant="solid"
            backgroundColor={errorBg}
            textColor={errorText}
          />
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.m,
    borderWidth: 1,
    gap: Spacing.s,
    padding: Spacing.m,
    ...Elevation.low,
  },
  issueKey: {
    fontSize: 12,
  },
  issueTitle: {
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
