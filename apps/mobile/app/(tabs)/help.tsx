import { Alert, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HelpScreen() {
  const currentYear = new Date().getFullYear();
  const borderColor = useThemeColor({}, "borderSubtle");
  const secondaryText = useThemeColor({}, "textSecondary");
  const tertiaryText = useThemeColor({}, "textTertiary");
  const disabledText = useThemeColor({}, "textDisabled");
  const primaryButton = useThemeColor({}, "brandPrimary");
  const textOnBrand = useThemeColor({}, "textOnBrand");

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Help Center</ThemedText>
        <ThemedText style={[styles.subtitle, { color: secondaryText }]}>
          JiraMobile の使い方やサポート情報
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.cardGrid}>
        <Pressable
          style={[styles.card, { borderColor }]}
          onPress={() =>
            Alert.alert("ドキュメント", "公式ドキュメントへのリンクを確認できます。")
          }
        >
          <ThemedText type="defaultSemiBold">ドキュメント</ThemedText>
          <ThemedText style={[styles.cardText, { color: tertiaryText }]}>
            機能の詳細や設定方法について確認します。
          </ThemedText>
          <ThemedText type="link">詳しく見る</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.card, { borderColor }]}
          onPress={() =>
            Alert.alert("ショートカット", "キーボードショートカット一覧を準備中です。")
          }
        >
          <ThemedText type="defaultSemiBold">
            キーボードショートカット
          </ThemedText>
          <ThemedText style={[styles.cardText, { color: tertiaryText }]}>
            効率的に操作するための一覧です。
          </ThemedText>
          <ThemedText type="link">一覧を表示</ThemedText>
        </Pressable>
        <ThemedView style={[styles.wideCard, { borderColor }]}>
          <ThemedText type="defaultSemiBold">お問い合わせ</ThemedText>
          <ThemedText style={[styles.cardText, { color: tertiaryText }]}>
            問題が発生した場合はサポートまでご連絡ください。
          </ThemedText>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: primaryButton }]}
            onPress={() => Alert.alert("サポート", "サポートチームに連絡しました。")}
          >
            <ThemedText style={{ color: textOnBrand }} type="bodySemiBold">
              サポートに連絡
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
      <ThemedText style={[styles.footer, { color: disabledText }]}>
        © {currentYear} JiraMobile Clone. All rights reserved.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardGrid: {
    gap: 12,
  },
  cardText: {
    fontSize: 12,
  },
  container: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
  },
  header: {
    gap: 4,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
  },
  subtitle: {
  },
  wideCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
});
