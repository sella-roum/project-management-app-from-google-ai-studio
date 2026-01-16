import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";

import { getCurrentUser, getUserStats, reset, updateUser } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ProfileScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const inputTextColor = useThemeColor({}, "text");
  const inputPlaceholderColor = useThemeColor({}, "icon");
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({ assigned: 0, reported: 0, leading: 0 });

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const user = await getCurrentUser();
      if (user) {
        setName(user.name);
        setEmail(user.email ?? "");
        setAvatarUrl(user.avatarUrl ?? "");
        const data = await getUserStats(user.id);
        setStats(data);
      }
    };
    void load();
  }, [ready]);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  useEffect(() => {
    const loadNotifications = async () => {
      const stored = await AsyncStorage.getItem("notificationsEnabled");
      setNotificationsEnabled(stored !== "false");
    };
    void loadNotifications();
  }, []);

  const handleSave = async () => {
    if (isProcessing) return;
    const user = await getCurrentUser();
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAvatarUrl = avatarUrl.trim();

    if (!trimmedName) {
      Alert.alert("入力エラー", "名前は必須です。");
      return;
    }
    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      Alert.alert("入力エラー", "正しいメールアドレスを入力してください。");
      return;
    }
    if (trimmedAvatarUrl) {
      try {
        const url = new URL(trimmedAvatarUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          Alert.alert("入力エラー", "URLはhttp/https形式で入力してください。");
          return;
        }
      } catch {
        Alert.alert("入力エラー", "正しいURLを入力してください。");
        return;
      }
    }

    setIsProcessing(true);
    try {
      await updateUser(user.id, {
        name: trimmedName,
        email: trimmedEmail || undefined,
        avatarUrl: trimmedAvatarUrl,
      });
      setName(trimmedName);
      setEmail(trimmedEmail);
      setAvatarUrl(trimmedAvatarUrl);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      Alert.alert(
        "保存エラー",
        "プロフィールの更新に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (isProcessing) return;
    const next = !notificationsEnabled;
    setIsProcessing(true);
    try {
      await AsyncStorage.setItem("notificationsEnabled", String(next));
      setNotificationsEnabled(next);
    } catch (error) {
      console.error("Failed to update notifications", error);
      Alert.alert(
        "更新エラー",
        "通知設定の更新に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLanguage = () => {
    Alert.alert(
      "言語設定",
      "現在は日本語のみサポートされています。将来のアップデートで他の言語を追加予定です。",
      [{ text: "OK" }],
    );
  };

  const handleLogout = () => {
    if (isProcessing) return;
    Alert.alert("ログアウト", "ログアウトしてもよろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true);
          try {
            await AsyncStorage.multiRemove([
              "isLoggedIn",
              "currentUserId",
            ]);
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Failed to log out", error);
            Alert.alert(
              "ログアウトエラー",
              "ログアウトに失敗しました。もう一度お試しください。",
            );
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReset = () => {
    if (isProcessing) return;
    Alert.alert(
      "アプリの初期化",
      "すべてのプロジェクトと課題が削除されます。この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "初期化する",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await reset();
              await AsyncStorage.multiRemove([
                "isLoggedIn",
                "currentUserId",
                "hasSetup",
              ]);
              router.replace("/(auth)/welcome");
            } catch (error) {
              console.error("Failed to reset app", error);
              Alert.alert(
                "初期化エラー",
                "初期化に失敗しました。もう一度お試しください。",
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Profile</ThemedText>
        {!isEditing ? (
          <Pressable
            onPress={() => setIsEditing(true)}
            disabled={isProcessing}
            style={styles.secondaryButton}
          >
            <ThemedText>編集</ThemedText>
          </Pressable>
        ) : (
          <ThemedView style={styles.headerRow}>
            <Pressable
              onPress={() => setIsEditing(false)}
              disabled={isProcessing}
              style={styles.ghostButton}
            >
              <ThemedText>キャンセル</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isProcessing}
              style={styles.primaryButton}
            >
              <ThemedText type="link">保存</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.profileCard}>
        <ThemedView style={styles.avatar}>
          {avatarUrl && !imageError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <ThemedText style={styles.avatarText}>
              {name ? name.charAt(0) : "U"}
            </ThemedText>
          )}
        </ThemedView>
        {isEditing ? (
          <ThemedView style={styles.section}>
            <TextInput
              style={[styles.input, { color: inputTextColor }]}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={inputPlaceholderColor}
            />
            <TextInput
              style={[styles.input, { color: inputTextColor }]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor={inputPlaceholderColor}
            />
            <TextInput
              style={[styles.input, { color: inputTextColor }]}
              placeholder="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              placeholderTextColor={inputPlaceholderColor}
            />
          </ThemedView>
        ) : (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">{name}</ThemedText>
            <ThemedText>{email || "user@example.com"}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.menuCard}>
        <Pressable
          onPress={handleToggleNotifications}
          disabled={isProcessing}
          style={styles.menuItem}
        >
          <ThemedText>通知</ThemedText>
          <ThemedView
            style={[
              styles.toggle,
              notificationsEnabled && styles.toggleActive,
            ]}
          >
            <ThemedView
              style={[
                styles.toggleThumb,
                notificationsEnabled && styles.toggleThumbActive,
              ]}
            />
          </ThemedView>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/notifications")}
          style={styles.menuItem}
        >
          <ThemedText>通知一覧</ThemedText>
        </Pressable>
        <Pressable onPress={handleLanguage} style={styles.menuItem}>
          <ThemedText>言語</ThemedText>
          <ThemedText style={styles.menuMeta}>日本語</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/help")} style={styles.menuItem}>
          <ThemedText>ヘルプ</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          disabled={isProcessing}
          style={styles.menuItem}
        >
          <ThemedText style={styles.dangerText}>ログアウト</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Stats</ThemedText>
        <ThemedText>Assigned issues: {stats.assigned}</ThemedText>
        <ThemedText>Reported issues: {stats.reported}</ThemedText>
        <ThemedText>Leading projects: {stats.leading}</ThemedText>
      </ThemedView>

      <Pressable
        onPress={handleReset}
        style={styles.dangerButton}
        disabled={isProcessing}
      >
        <ThemedText type="link">
          {isProcessing ? "処理中..." : "アプリを初期化する"}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  avatarImage: {
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  container: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 12,
  },
  dangerText: {
    color: "#dc2626",
  },
  ghostButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menuItem: {
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuMeta: {
    color: "#6b7280",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  profileCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
    padding: 16,
  },
  secondaryButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  section: {
    gap: 8,
  },
  toggle: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 44,
  },
  toggleActive: {
    backgroundColor: "#2563eb",
  },
  toggleThumb: {
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 20,
    marginLeft: 2,
    width: 20,
  },
  toggleThumbActive: {
    marginLeft: 22,
  },
});
