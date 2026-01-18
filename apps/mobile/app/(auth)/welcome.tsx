import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Alert, StyleSheet } from "react-native";
import { useState } from "react";

import { clearDatabase, seedDatabase } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const surfaceBase = useThemeColor({}, "surfaceBase");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const metaTextColor = useThemeColor({}, "textSecondary");

  const runWithLoading = async (
    action: () => Promise<void>,
    logLabel: string,
    alertMessage: string,
  ) => {
    setLoading(true);
    try {
      await action();
    } catch (error) {
      console.error(logLabel, error);
      Alert.alert("初期化エラー", alertMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () =>
    runWithLoading(
      async () => {
        await seedDatabase();
        await AsyncStorage.multiSet([
          ["appInitialized", "true"],
          ["hasSetup", "true"],
        ]);
        router.replace("/(auth)/login");
      },
      "Failed to start demo mode",
      "デモデータの準備に失敗しました。もう一度お試しください。",
    );

  const handleFreshStart = () =>
    runWithLoading(
      async () => {
        await clearDatabase();
        await AsyncStorage.setItem("appInitialized", "true");
        await AsyncStorage.removeItem("hasSetup");
        router.replace("/(auth)/login");
      },
      "Failed to start fresh",
      "初期化に失敗しました。もう一度お試しください。",
    );

  return (
    <ThemedView style={[styles.container, { backgroundColor: surfaceBase }]}>
      <ThemedView
        style={[
          styles.card,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title">JiraMobile Clone へようこそ</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: metaTextColor }]}>
            モバイルファーストのプロジェクト管理体験を始めましょう。
            開始方法を選択してください。
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.optionGrid}>
          <ThemedView
            style={[
              styles.optionCard,
              { borderColor: borderSubtle, backgroundColor: surfaceBase },
            ]}
          >
            <ThemedText type="headline">デモデータで開始</ThemedText>
            <ThemedText type="body" style={[styles.optionText, { color: metaTextColor }]}>
              サンプルプロジェクト、課題、ユーザーが含まれた状態で開始します。
            </ThemedText>
            <Button
              label={loading ? "準備中..." : "デモモード"}
              onPress={handleDemoMode}
              disabled={loading}
            />
          </ThemedView>
          <ThemedView
            style={[
              styles.optionCard,
              { borderColor: borderSubtle, backgroundColor: surfaceBase },
            ]}
          >
            <ThemedText type="headline">最初から開始</ThemedText>
            <ThemedText type="body" style={[styles.optionText, { color: metaTextColor }]}>
              空の状態から開始して、アカウントとプロジェクトを作成します。
            </ThemedText>
            <Button
              label="フレッシュスタート"
              onPress={handleFreshStart}
              disabled={loading}
              variant="secondary"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.l,
    padding: Spacing.xl,
    ...Elevation.medium,
  },
  header: {
    gap: Spacing.s,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: Radius.l,
    gap: Spacing.s,
    padding: Spacing.l,
  },
  optionGrid: {
    gap: Spacing.m,
  },
  optionText: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 12,
  },
});
