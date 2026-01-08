import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { clearDatabase, seedDatabase } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleDemoMode = async () => {
    await seedDatabase();
    await AsyncStorage.multiSet([
      ["appInitialized", "true"],
      ["hasSetup", "true"],
    ]);
    router.replace("/(auth)/login");
  };

  const handleFreshStart = async () => {
    await clearDatabase();
    await AsyncStorage.setItem("appInitialized", "true");
    await AsyncStorage.removeItem("hasSetup");
    router.replace("/(auth)/login");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome</ThemedText>
      <ThemedText type="subtitle">
        モバイルファーストのプロジェクト管理体験を始めましょう。
      </ThemedText>
      <ThemedView style={styles.actions}>
        <Pressable onPress={handleDemoMode}>
          <ThemedText type="link">デモデータで開始</ThemedText>
        </Pressable>
        <Pressable onPress={handleFreshStart}>
          <ThemedText type="link">最初から開始</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
