import { Slot, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { ProjectDataProvider } from "@/components/project/project-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const PRIMARY_TABS = ["summary", "board", "backlog"] as const;
const MORE_TABS = ["timeline", "releases", "automation", "settings"] as const;

export default function ProjectLayout() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const normalizedProjectId = useMemo(
    () => (Array.isArray(projectId) ? projectId[0] : projectId),
    [projectId],
  );
  const [showMore, setShowMore] = useState(false);
  const borderColor = useThemeColor({}, "borderSubtle");

  if (!normalizedProjectId) {
    return null;
  }

  const navigateTo = (tab: string) => {
    router.push(`/project/${normalizedProjectId}/${tab}`);
    setShowMore(false);
  };

  return (
    <ProjectDataProvider projectId={normalizedProjectId}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.tabRow}>
          {PRIMARY_TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => navigateTo(tab)}
              style={[styles.tab, { borderColor }]}
            >
              <ThemedText style={styles.tabLabel}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setShowMore(true)}
            style={[styles.tab, { borderColor }]}
          >
            <ThemedText style={styles.tabLabel}>More</ThemedText>
          </Pressable>
        </ThemedView>
        {showMore ? (
          <ThemedView style={[styles.moreMenu, { borderBottomColor: borderColor }]}>
            {MORE_TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => navigateTo(tab)}
                style={[styles.moreItem, { borderColor }]}
              >
                <ThemedText>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowMore(false)}
              style={[styles.moreItem, { borderColor }]}
            >
              <ThemedText>閉じる</ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}
        <Slot />
      </ThemedView>
    </ProjectDataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  moreItem: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moreMenu: {
    borderBottomWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
