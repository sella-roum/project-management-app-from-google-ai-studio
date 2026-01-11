import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import {
  checkIfDatabaseIsSeeded,
  loginAsUser,
  registerUser,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
        <ThemedView style={styles.logo}>
          <ThemedText style={styles.logoText}>J</ThemedText>
        </ThemedView>
        <ThemedText type="title">JiraMobile</ThemedText>
        <ThemedText style={styles.tagline}>
          作業を円滑に。どこにいても。
        </ThemedText>
      </ThemedView>

      {error ? (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.error}>{error}</ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.form}>
        <ThemedView style={styles.field}>
          <ThemedText style={styles.label}>メールアドレス</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="name@company.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </ThemedView>
        <Pressable
          onPress={handleStandardLogin}
          disabled={isLoading}
          style={styles.primaryButton}
        >
          <ThemedText type="link">
            {isLoading ? "処理中..." : "ログイン / 新規登録"}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {isDemoMode ? (
        <ThemedView style={styles.demoSection}>
          <ThemedText style={styles.demoLabel}>デモ用</ThemedText>
          <Pressable onPress={handleTestLogin} style={styles.secondaryButton}>
            <ThemedText type="link">テストアカウント (Alice) でログイン</ThemedText>
          </Pressable>
        </ThemedView>
      ) : null}

      <ThemedText style={styles.footer}>
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
    paddingHorizontal: 24,
  },
  demoLabel: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center",
  },
  demoSection: {
    gap: 12,
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  field: {
    gap: 6,
  },
  footer: {
    color: "#9ca3af",
    fontSize: 10,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  form: {
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: "#6b7280",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  logo: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
  },
  tagline: {
    color: "#6b7280",
    fontSize: 12,
  },
});
