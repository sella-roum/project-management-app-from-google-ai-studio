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

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const secondaryText = useThemeColor({}, "textSecondary");
  const accentText = useThemeColor({}, "brandPrimary");
  const onlineColor = useThemeColor({}, "stateSuccessBg");
  const offlineColor = useThemeColor({}, "borderSubtle");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");

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
          <ThemedText style={[styles.subtitle, { color: secondaryText }]} type="body">
            今日のやるべきことはこちらです。
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.onlineDot,
            { backgroundColor: isOnline ? onlineColor : offlineColor },
          ]}
        />
      </ThemedView>

      <ThemedView
        style={[
          styles.heroCard,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
        ]}
      >
        <ThemedView style={styles.heroRow}>
          <ThemedView style={styles.heroText}>
            <ThemedText type="headline">今日の目的</ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: secondaryText }]}>
              重要課題の整理と、未読通知の確認を進めましょう。
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.heroMeta}>
            <ThemedText type="caption" style={[styles.subtitle, { color: secondaryText }]}>
              未読通知
            </ThemedText>
            <ThemedText type="headline" style={{ color: accentText }}>
              {unreadCount}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <Button
          label="課題を作成"
          onPress={() => router.push({ pathname: "/modal", params: { mode: "issue" } })}
          variant="primary"
        />
      </ThemedView>

      {!ready ? (
        <ThemedView style={styles.statsRow}>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <Skeleton width={48} />
            <Skeleton width={80} />
          </ThemedView>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <Skeleton width={48} />
            <Skeleton width={80} />
          </ThemedView>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <Skeleton width={48} />
            <Skeleton width={80} />
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.statsRow}>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <ThemedText type="bodySemiBold">{myIssues.length}</ThemedText>
            <ThemedText style={styles.statLabel} type="caption">
              自分の課題
            </ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <ThemedText type="bodySemiBold">
              {
                myIssues.filter(
                  (issue) =>
                    issue.priority === "Highest" || issue.priority === "High",
                ).length
              }
            </ThemedText>
            <ThemedText style={styles.statLabel} type="caption">
              高優先度
            </ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              styles.statCard,
              { backgroundColor: surfaceRaised, borderColor: borderSubtle },
            ]}
          >
            <ThemedText type="bodySemiBold" style={{ color: accentText }}>
              {unreadCount}
            </ThemedText>
            <ThemedText style={styles.statLabel} type="caption">
              未読通知
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {recentIssues.length > 0 ? (
        <ThemedView style={styles.section}>
          <ThemedText type="headline">最近見た項目</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ThemedView style={styles.horizontalRow}>
              {recentIssues.map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                >
                  <ThemedView style={styles.recentCard}>
                    <ThemedText type="caption">{issue.key}</ThemedText>
                    <ThemedText numberOfLines={2} type="bodySemiBold">
                      {issue.title}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </ThemedView>
          </ScrollView>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.section}>
        <ThemedView style={styles.rowBetween}>
          <ThemedText type="headline">あなたの作業</ThemedText>
          <Pressable onPress={() => router.push("/(tabs)/search")}>
            <ThemedText type="link">すべて</ThemedText>
          </Pressable>
        </ThemedView>
        {myIssues.length === 0 ? (
          <EmptyState
            title="すべて完了しました"
            description="新しい課題を作成して次のタスクに取り掛かりましょう。"
            actionLabel="課題を作成"
            onAction={() =>
              router.push({ pathname: "/modal", params: { mode: "issue" } })
            }
          />
        ) : (
          myIssues.slice(0, 10).map((issue) => (
            <ThemedView key={issue.id} style={styles.card}>
              <ThemedText type="caption">{issue.key}</ThemedText>
              <ThemedText type="bodySemiBold">{issue.title}</ThemedText>
              <ThemedView style={styles.rowWrap}>
                <Button
                  label="進行中"
                  onPress={() => handleStatusChange(issue.id, "In Progress")}
                  variant="secondary"
                />
                <Button
                  label="完了"
                  onPress={() => handleStatusChange(issue.id, "Done")}
                  variant="primary"
                />
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <Link href="/(tabs)/projects">
          <ThemedText type="link">プロジェクトを見る</ThemedText>
        </Link>
        <Link href="/(tabs)/dashboards">
          <ThemedText type="link">ダッシュボードを見る</ThemedText>
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
    gap: Spacing.s,
    padding: Spacing.l,
  },
  container: {
    flex: 1,
    gap: Spacing.l,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 24,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.m,
    padding: Spacing.l,
  },
  heroMeta: {
    alignItems: "flex-end",
  },
  heroRow: {
    flexDirection: "row",
    gap: Spacing.m,
    justifyContent: "space-between",
  },
  heroText: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalRow: {
    flexDirection: "row",
    gap: Spacing.m,
    paddingVertical: Spacing.s,
  },
  onlineDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  recentCard: {
    borderRadius: 16,
    gap: Spacing.s,
    padding: Spacing.l,
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
    gap: Spacing.s,
  },
  section: {
    gap: Spacing.m,
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.xs,
    minHeight: 92,
    padding: Spacing.l,
  },
  statLabel: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  subtitle: {},
});
