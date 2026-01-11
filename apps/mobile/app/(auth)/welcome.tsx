import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet } from "react-native";
import { useState } from "react";

import { clearDatabase, seedDatabase } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDemoMode = async () => {
    setLoading(true);
    try {
      await seedDatabase();
      await AsyncStorage.multiSet([
        ["appInitialized", "true"],
        ["hasSetup", "true"],
      ]);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Failed to start demo mode", error);
      Alert.alert(
        "初期化エラー",
        "デモデータの準備に失敗しました。もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFreshStart = async () => {
    setLoading(true);
    try {
      await clearDatabase();
      await AsyncStorage.setItem("appInitialized", "true");
      await AsyncStorage.removeItem("hasSetup");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Failed to start fresh", error);
      Alert.alert(
        "初期化エラー",
        "初期化に失敗しました。もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">JiraMobile Clone へようこそ</ThemedText>
          <ThemedText style={styles.subtitle}>
            モバイルファーストのプロジェクト管理体験を始めましょう。
            開始方法を選択してください。
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.optionGrid}>
          <ThemedView style={styles.optionCard}>
            <ThemedText type="subtitle">デモデータで開始</ThemedText>
            <ThemedText style={styles.optionText}>
              サンプルプロジェクト、課題、ユーザーが含まれた状態で開始します。
            </ThemedText>
            <Pressable
              onPress={handleDemoMode}
              disabled={loading}
              style={styles.primaryButton}
            >
              <ThemedText type="link">
                {loading ? "準備中..." : "デモモード"}
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.optionCard}>
            <ThemedText type="subtitle">最初から開始</ThemedText>
            <ThemedText style={styles.optionText}>
              空の状態から開始して、アカウントとプロジェクトを作成します。
            </ThemedText>
            <Pressable
              onPress={handleFreshStart}
              disabled={loading}
              style={styles.secondaryButton}
            >
              <ThemedText type="link">フレッシュスタート</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  optionCard: {
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  optionGrid: {
    gap: 12,
  },
  optionText: {
    color: "#6b7280",
    fontSize: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 12,
  },
});
