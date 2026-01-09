import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { Issue, User } from "@repo/core";
import {
  getCurrentUser,
  getCurrentUserId,
  getIssuesForUser,
  getRecentIssues,
  getUnreadMentionCount,
  updateIssueStatus,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function HomeScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const [currentUser, assigned, unread, recent] = await Promise.all([
        getCurrentUser(),
        getIssuesForUser(getCurrentUserId()),
        getUnreadMentionCount(),
        getRecentIssues(),
      ]);
      setUser(currentUser ?? null);
      setMyIssues(assigned);
      setRecentIssues(recent);
      setUnreadCount(unread);
    };
    void load();
  }, [ready]);

  useEffect(() => {
    setIsOnline(true);
  }, []);

  const handleStatusChange = async (issueId: string, status: Issue["status"]) => {
    await updateIssueStatus(issueId, status);
    const assigned = await getIssuesForUser(getCurrentUserId());
    setMyIssues(assigned);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedView>
          <ThemedText type="title">
            {user ? `こんにちは、${user.name.split(" ")[0]}さん` : "Home"}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            今日のやるべきことはこちらです。
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.onlineDot,
            { backgroundColor: isOnline ? "#22c55e" : "#d1d5db" },
          ]}
        />
      </ThemedView>

      {!ready ? (
        <ThemedText>Preparing your workspace...</ThemedText>
      ) : (
        <ThemedView style={styles.statsRow}>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold">{myIssues.length}</ThemedText>
            <ThemedText style={styles.statLabel}>自分の課題</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold">
              {
                myIssues.filter(
                  (issue) =>
                    issue.priority === "Highest" || issue.priority === "High",
                ).length
              }
            </ThemedText>
            <ThemedText style={styles.statLabel}>高優先度</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold">{unreadCount}</ThemedText>
            <ThemedText style={styles.statLabel}>未読通知</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {recentIssues.length > 0 ? (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">最近見た項目</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ThemedView style={styles.horizontalRow}>
              {recentIssues.map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                >
                  <ThemedView style={styles.recentCard}>
                    <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
                    <ThemedText numberOfLines={2}>{issue.title}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </ThemedView>
          </ScrollView>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.section}>
        <ThemedView style={styles.rowBetween}>
          <ThemedText type="subtitle">あなたの作業</ThemedText>
          <Pressable onPress={() => router.push("/(tabs)/search")}>
            <ThemedText type="link">すべて</ThemedText>
          </Pressable>
        </ThemedView>
        {myIssues.length === 0 ? (
          <ThemedText>すべて完了しました。</ThemedText>
        ) : (
          myIssues.slice(0, 10).map((issue) => (
            <ThemedView key={issue.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
              <ThemedText>{issue.title}</ThemedText>
              <ThemedView style={styles.rowWrap}>
                <Pressable
                  onPress={() => handleStatusChange(issue.id, "In Progress")}
                  style={styles.secondaryButton}
                >
                  <ThemedText>進行中</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleStatusChange(issue.id, "Done")}
                  style={styles.primaryButton}
                >
                  <ThemedText type="link">完了</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <Link href="/(tabs)/projects">
          <ThemedText type="link">プロジェクトを見る</ThemedText>
        </Link>
        <Link href={{ pathname: "/modal", params: { mode: "issue" } }}>
          <ThemedText type="link">課題を作成</ThemedText>
        </Link>
      </ThemedView>
    </ScrollView>
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
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  onlineDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentCard: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
    width: 200,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  section: {
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  subtitle: {
    color: "#6b7280",
  },
});
