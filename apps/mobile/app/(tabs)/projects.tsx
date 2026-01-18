import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "expo-router";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { Issue } from "@repo/core";
import { CATEGORY_LABELS } from "@repo/core";
import { getIssues, getProjects, toggleProjectStar } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  type: "Scrum" | "Kanban";
  category?: "Software" | "Business";
  description?: string;
  iconUrl?: string;
  starred?: boolean;
  totalIssues: number;
  doneIssues: number;
  nextDueDate?: string;
};

const buildIssueStats = (issueData: Issue[]) =>
  issueData.reduce<Record<string, { totalIssues: number; doneIssues: number; nextDueDate?: string }>>(
    (acc, issue) => {
      const current = acc[issue.projectId] ?? {
        totalIssues: 0,
        doneIssues: 0,
      };
      const totalIssues = current.totalIssues + 1;
      const doneIssues =
        current.doneIssues + (issue.status === "Done" ? 1 : 0);
      let nextDueDate = current.nextDueDate;
      if (issue.status !== "Done" && issue.dueDate) {
        if (!nextDueDate) {
          nextDueDate = issue.dueDate;
        } else if (
          new Date(issue.dueDate).getTime() <
          new Date(nextDueDate).getTime()
        ) {
          nextDueDate = issue.dueDate;
        }
      }
      return {
        ...acc,
        [issue.projectId]: {
          totalIssues,
          doneIssues,
          nextDueDate,
        },
      };
    },
    {},
  );

export default function ProjectsScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const metaTextColor = useThemeColor({}, "textSecondary");
  const cardBackground = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const iconBadgeBg = useThemeColor({}, "surfaceOverlay");
  const starActive = useThemeColor({}, "stateWarningText");
  const starInactive = useThemeColor({}, "textTertiary");
  const scrumAccent = useThemeColor({}, "stateSuccessText");
  const kanbanAccent = useThemeColor({}, "stateInfoText");
  const emptyStateBorder = useThemeColor({}, "borderSubtle");
  const emptyStateBackground = useThemeColor({}, "surfaceBase");
  const progressTrack = useThemeColor({}, "surfaceOverlay");
  const progressFill = useThemeColor({}, "stateSuccessText");
  const progressText = useThemeColor({}, "stateSuccessText");
  const dueAlertText = useThemeColor({}, "stateErrorText");
  const dueAlertBackground = useThemeColor({}, "stateErrorBg");

  const loadProjects = useCallback(async () => {
    const [data, issueData] = await Promise.all([getProjects(), getIssues()]);
    const issueStats = buildIssueStats(issueData);
    setProjects(
      data.map((project) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        type: project.type,
        category: project.category,
        description: project.description,
        iconUrl: project.iconUrl,
        starred: project.starred,
        totalIssues: issueStats[project.id]?.totalIssues ?? 0,
        doneIssues: issueStats[project.id]?.doneIssues ?? 0,
        nextDueDate: issueStats[project.id]?.nextDueDate,
      })),
    );
  }, []);

  useEffect(() => {
    if (!ready) return;
    void loadProjects();
  }, [ready, loadProjects]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [projects.length]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (a.starred === b.starred) return a.name.localeCompare(b.name);
      return a.starred ? -1 : 1;
    });
  }, [projects]);

  const handleToggleStar = async (projectId: string) => {
    await toggleProjectStar(projectId);
    await loadProjects();
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const formatDueDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("ja-JP") : "期限なし";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Projects</ThemedText>
        <Link href={{ pathname: "/modal", params: { mode: "project" } }}>
          <ThemedText type="link">Create project</ThemedText>
        </Link>
      </ThemedView>
      {!ready ? (
        <ThemedText type="body">Loading projects...</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {sortedProjects.length === 0 ? (
            <ThemedView
              style={[
                styles.emptyState,
                { borderColor: emptyStateBorder, backgroundColor: emptyStateBackground },
              ]}
            >
              <ThemedText type="headline" style={styles.emptyStateTitle}>
                Start your first project
              </ThemedText>
              <ThemedText type="body" style={[styles.metaText, { color: metaTextColor }]}>
                Create a project to group issues, track progress, and share updates with the
                team.
              </ThemedText>
              <Button
                label="Create project"
                onPress={() => router.push({ pathname: "/modal", params: { mode: "project" } })}
              />
            </ThemedView>
          ) : (
            sortedProjects.map((project) => {
              const completionRate =
                project.totalIssues > 0
                  ? Math.round((project.doneIssues / project.totalIssues) * 100)
                  : 0;
              const isOverdue = Boolean(
                project.nextDueDate &&
                  new Date(project.nextDueDate).getTime() < Date.now(),
              );
              return (
                <Pressable
                  key={project.id}
                  onPress={() => handleOpenProject(project.id)}
                  style={[
                    styles.card,
                    { backgroundColor: cardBackground, borderColor: borderSubtle },
                  ]}
                >
                  <View
                    style={[
                      styles.typeAccent,
                      { backgroundColor: project.type === "Scrum" ? scrumAccent : kanbanAccent },
                    ]}
                  />
                  <ThemedView style={styles.cardHeader}>
                    <ThemedView style={styles.cardTitleRow}>
                      <ThemedText
                        style={[styles.iconBadge, { backgroundColor: iconBadgeBg }]}
                        type="caption"
                      >
                        {project.iconUrl || "PJ"}
                      </ThemedText>
                      <ThemedView style={styles.cardTitleCopy}>
                        <ThemedText type="headline">{project.name}</ThemedText>
                        <ThemedText
                          type="caption"
                          style={[styles.metaText, { color: metaTextColor }]}
                        >
                          {project.key} &bull; {project.type}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <Pressable
                      onPress={() => {
                        void handleToggleStar(project.id);
                      }}
                      style={styles.starButton}
                    >
                      <IconSymbol
                        size={20}
                        name={project.starred ? "star.fill" : "star"}
                        color={project.starred ? starActive : starInactive}
                      />
                    </Pressable>
                  </ThemedView>
                  <ThemedView style={styles.progressBlock}>
                    <ThemedView style={styles.progressRow}>
                      <ThemedText type="caption" style={{ color: progressText }}>
                        進捗
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: progressText }}>
                        {project.doneIssues}/{project.totalIssues}
                      </ThemedText>
                    </ThemedView>
                    <View style={[styles.progressTrack, { backgroundColor: progressTrack }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: progressFill,
                            width: `${completionRate}%`,
                          },
                        ]}
                      />
                    </View>
                  </ThemedView>
                  <ThemedView style={styles.dueRow}>
                    <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
                      期限: {formatDueDate(project.nextDueDate)}
                    </ThemedText>
                    {isOverdue ? (
                      <Chip
                        label="期限切れ"
                        variant="solid"
                        backgroundColor={dueAlertBackground}
                        textColor={dueAlertText}
                        borderColor={dueAlertBackground}
                      />
                    ) : null}
                  </ThemedView>
                  {project.description ? (
                    <ThemedText
                      numberOfLines={2}
                      type="body"
                      style={[styles.metaText, { color: metaTextColor }]}
                    >
                      {project.description}
                    </ThemedText>
                  ) : null}
                  <ThemedView style={styles.cardFooter}>
                    <Chip label={CATEGORY_LABELS[project.category ?? "Software"]} />
                    <IconSymbol name="ellipsis" size={18} color={starInactive} />
                  </ThemedView>
                </Pressable>
              );
            })
          )}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.s,
    padding: Spacing.l,
    paddingLeft: Spacing.l + Spacing.s,
    ...Elevation.low,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.s,
  },
  cardTitleCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.s,
  },
  container: {
    gap: Spacing.m,
    padding: Spacing.xl,
  },
  dueRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBadge: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  list: {
    gap: Spacing.m,
  },
  metaText: {
    fontSize: 12,
  },
  progressBlock: {
    gap: Spacing.xs,
  },
  progressFill: {
    borderRadius: Radius.l,
    height: "100%",
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    borderRadius: Radius.l,
    height: 6,
    overflow: "hidden",
  },
  emptyState: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.s,
    padding: Spacing.l,
  },
  emptyStateTitle: {
    fontWeight: "600",
  },
  starButton: {
    paddingHorizontal: Spacing.s,
  },
  typeAccent: {
    borderBottomLeftRadius: Radius.l,
    borderTopLeftRadius: Radius.l,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
});
