import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import {
  checkIfDatabaseIsSeeded,
  loginAsUser,
  registerUser,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const errorText = useThemeColor({}, "stateErrorText");
  const errorBg = useThemeColor({}, "stateErrorBg");
  const errorBorder = useThemeColor({}, "stateErrorText");
  const metaTextColor = useThemeColor({}, "textSecondary");
  const footerTextColor = useThemeColor({}, "textTertiary");

  useEffect(() => {
    checkIfDatabaseIsSeeded().then((seeded) => setIsDemoMode(seeded));
  }, []);

  const finishLogin = async () => {
    await AsyncStorage.setItem("isLoggedIn", "true");
    const hasSetup = await AsyncStorage.getItem("hasSetup");
    router.replace(hasSetup === "true" ? "/(tabs)/home" : "/setup");
  };

  const handleStandardLogin = async () => {
    if (!email) {
      setError("メールアドレスを入力してください。");
      return;
    }
    setIsLoading(true);
    try {
      const existingUser = await loginAsUser(email);
      if (existingUser) {
        await finishLogin();
      } else {
        const name = email.split("@")[0] || "User";
        await registerUser(email, name);
        await finishLogin();
      }
    } catch {
      setError("ログイン処理中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    await AsyncStorage.setItem("currentUserId", "u1");
    await finishLogin();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={[styles.logo, { backgroundColor: brandPrimary }]}>
          <ThemedText style={styles.logoText}>J</ThemedText>
        </ThemedView>
        <ThemedText type="title">JiraMobile</ThemedText>
        <ThemedText type="body" style={[styles.tagline, { color: metaTextColor }]}>
          作業を円滑に。どこにいても。
        </ThemedText>
      </ThemedView>

      {error ? (
        <ThemedView
          style={[
            styles.errorBox,
            { backgroundColor: errorBg, borderColor: errorBorder },
          ]}
        >
          <ThemedText type="caption" style={[styles.error, { color: errorText }]}>
            {error}
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView
        style={[
          styles.form,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
        ]}
      >
        <Input
          label="メールアドレス"
          placeholder="name@company.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button
          label={isLoading ? "処理中..." : "ログイン / 新規登録"}
          onPress={handleStandardLogin}
          disabled={isLoading}
        />
      </ThemedView>

      {isDemoMode ? (
        <ThemedView style={styles.demoSection}>
          <ThemedText type="caption" style={[styles.demoLabel, { color: metaTextColor }]}>
            デモ用
          </ThemedText>
          <Button
            label="テストアカウント (Alice) でログイン"
            onPress={handleTestLogin}
            variant="secondary"
          />
        </ThemedView>
      ) : null}

      <ThemedText type="caption" style={[styles.footer, { color: footerTextColor }]}>
        続行することで、利用規約およびプライバシーポリシーに同意したことになります。
        {"\n"}※これはデモアプリです。パスワードは保存されません。
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.l,
  },
  demoLabel: {
    textAlign: "center",
  },
  demoSection: {
    gap: Spacing.m,
  },
  error: {
    fontSize: 12,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.m,
  },
  footer: {
    fontSize: 10,
    textAlign: "center",
  },
  form: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.l,
    padding: Spacing.l,
    ...Elevation.low,
  },
  header: {
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.l,
  },
  logo: {
    alignItems: "center",
    borderRadius: Radius.m,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 12,
  },
});
