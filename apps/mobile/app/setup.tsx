import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { setupInitialProject } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function SetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState<"Scrum" | "Kanban">("Kanban");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!name) return;
    setLoading(true);
    await setupInitialProject(
      name,
      key || name.substring(0, 3).toUpperCase(),
      type,
    );
    await AsyncStorage.setItem("hasSetup", "true");
    setLoading(false);
    router.replace("/(tabs)/home");
  };

  return (
    <ThemedView style={styles.container}>
      {step === 1 ? (
        <ThemedView style={styles.panel}>
          <ThemedText type="title">初期設定</ThemedText>
          <ThemedText type="subtitle">
            最初のプロジェクトを作成して始めましょう。
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="プロジェクト名 (例: 開発チーム)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="キー (例: DEV)"
            value={key}
            onChangeText={(value) => setKey(value.toUpperCase())}
            maxLength={5}
          />
          <Pressable
            onPress={() => setStep(2)}
            disabled={!name}
            style={styles.primaryButton}
          >
            <ThemedText type="link">次へ</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ThemedView style={styles.panel}>
          <ThemedText type="title">テンプレートを選択</ThemedText>
          <ThemedText type="subtitle">
            プロジェクトの進め方を選んでください。
          </ThemedText>
          <Pressable
            onPress={() => setType("Kanban")}
            style={[
              styles.option,
              type === "Kanban" && styles.optionActive,
            ]}
          >
            <ThemedText type="defaultSemiBold">カンバン</ThemedText>
            <ThemedText>継続的なタスク管理に最適です。</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setType("Scrum")}
            style={[
              styles.option,
              type === "Scrum" && styles.optionActive,
            ]}
          >
            <ThemedText type="defaultSemiBold">スクラム</ThemedText>
            <ThemedText>スプリントで進行するチーム向け。</ThemedText>
          </Pressable>
          <ThemedView style={styles.actions}>
            <Pressable onPress={() => setStep(1)} style={styles.secondaryButton}>
              <ThemedText type="link">戻る</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              disabled={loading || !name}
              style={styles.primaryButton}
            >
              <ThemedText type="link">
                {loading ? "作成中..." : "開始する"}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  optionActive: {
    borderColor: "#2563eb",
  },
  panel: {
    gap: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
});
