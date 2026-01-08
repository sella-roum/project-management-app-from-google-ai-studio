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
  const [password, setPassword] = useState("");
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
      <ThemedText type="title">Log in</ThemedText>
      <ThemedText type="default">
        JiraMobile にアクセスするためのアカウントを入力してください。
      </ThemedText>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <TextInput
        style={styles.input}
        placeholder="name@company.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable onPress={handleStandardLogin} disabled={isLoading}>
        <ThemedText type="link">
          {isLoading ? "処理中..." : "ログイン / 新規登録"}
        </ThemedText>
      </Pressable>
      {isDemoMode ? (
        <Pressable onPress={handleTestLogin}>
          <ThemedText type="link">テストアカウントでログイン</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  error: {
    color: "#b91c1c",
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
