import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function DashboardsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Dashboards</ThemedText>
      <ThemedText>
        チームやプロジェクトの状況を集約して確認できます。
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
