import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

import { setupInitialProject } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type SetupWizardProps = {
  onComplete: () => void;
};

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState<"Scrum" | "Kanban">("Kanban");
  const [loading, setLoading] = useState(false);
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const activeBorder = useThemeColor({}, "brandPrimary");
  const activeBackground = useThemeColor({}, "stateInfoBg");
  const inputTextColor = useThemeColor({}, "textPrimary");
  const inputPlaceholderColor = useThemeColor({}, "textTertiary");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const progressText = useThemeColor({}, "textSecondary");
  const progressFill = useThemeColor({}, "brandPrimary");
  const progressTrack = useThemeColor({}, "surfaceOverlay");

  const handleFinish = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("入力エラー", "プロジェクト名を入力してください。");
      return;
    }
    const trimmedKey = key.trim();
    const fallbackKey = trimmedName.toUpperCase().replace(/\s+/g, "");
    const safeKey =
      (trimmedKey || fallbackKey || "PRJ").slice(0, 5).padEnd(3, "J");
    setLoading(true);
    try {
      await setupInitialProject(trimmedName, safeKey, type);
      await AsyncStorage.setItem("hasSetup", "true");
      setStep(3);
    } catch (error) {
      console.error("Failed to complete setup", error);
      Alert.alert("作成エラー", "プロジェクト作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.progressHeader}>
        <ThemedText type="caption" style={{ color: progressText }}>
          Step {step}/3
        </ThemedText>
        <View style={[styles.progressTrack, { backgroundColor: progressTrack }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: progressFill, width: `${(step / 3) * 100}%` },
            ]}
          />
        </View>
      </ThemedView>
      {step === 1 ? (
        <ThemedView
          style={[styles.panel, { backgroundColor: surfaceRaised, borderColor: borderSubtle }]}
        >
          <ThemedText type="title">初期設定</ThemedText>
          <ThemedText type="body">
            まずは最初のチームプロジェクトを作成しましょう。
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: borderSubtle, color: inputTextColor }]}
            placeholder="プロジェクト名 (例: 開発チーム)"
            value={name}
            onChangeText={setName}
            placeholderTextColor={inputPlaceholderColor}
          />
          <TextInput
            style={[styles.input, { borderColor: borderSubtle, color: inputTextColor }]}
            placeholder="キー (例: DEV)"
            value={key}
            onChangeText={(value) => setKey(value.toUpperCase())}
            maxLength={5}
            placeholderTextColor={inputPlaceholderColor}
          />
          <Button label="次へ" onPress={() => setStep(2)} disabled={!name} />
        </ThemedView>
      ) : step === 2 ? (
        <ThemedView
          style={[styles.panel, { backgroundColor: surfaceRaised, borderColor: borderSubtle }]}
        >
          <ThemedText type="title">テンプレートの選択</ThemedText>
          <ThemedText type="body">
            チームの進め方に合わせてテンプレートを選んでください。
          </ThemedText>
          <Pressable
            onPress={() => setType("Kanban")}
            style={[
              styles.option,
              { borderColor: borderSubtle },
              type === "Kanban" && {
                borderColor: activeBorder,
                backgroundColor: activeBackground,
              },
            ]}
          >
            <ThemedText type="bodySemiBold">カンバン</ThemedText>
            <ThemedText type="body">継続的なタスク管理に最適です。</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setType("Scrum")}
            style={[
              styles.option,
              { borderColor: borderSubtle },
              type === "Scrum" && {
                borderColor: activeBorder,
                backgroundColor: activeBackground,
              },
            ]}
          >
            <ThemedText type="bodySemiBold">スクラム</ThemedText>
            <ThemedText type="body">スプリントで進行するチーム向け。</ThemedText>
          </Pressable>
          <ThemedView style={styles.actions}>
            <Button label="戻る" onPress={() => setStep(1)} variant="secondary" />
            <Button
              label={loading ? "作成中..." : "開始する"}
              onPress={handleFinish}
              disabled={loading || !name}
            />
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView
          style={[styles.panel, { backgroundColor: surfaceRaised, borderColor: borderSubtle }]}
        >
          <ThemedText type="title">準備完了</ThemedText>
          <ThemedText type="body">
            最初のプロジェクトが作成されました。次は課題を追加して進捗を管理しましょう。
          </ThemedText>
          <Button label="ダッシュボードへ" onPress={onComplete} />
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.m,
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    gap: Spacing.l,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.l,
    gap: Spacing.xs,
    padding: Spacing.l,
    ...Elevation.low,
  },
  progressFill: {
    borderRadius: Radius.l,
    height: "100%",
  },
  progressHeader: {
    gap: Spacing.s,
  },
  progressTrack: {
    borderRadius: Radius.l,
    height: 6,
    overflow: "hidden",
  },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.l,
    gap: Spacing.l,
    padding: Spacing.l,
    ...Elevation.low,
  },
});
