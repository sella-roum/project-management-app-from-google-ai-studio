import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { getCurrentUser, getUserStats, reset, updateUser } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ProfileScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const avatarBg = useThemeColor({}, "brandPrimary");
  const menuMetaColor = useThemeColor({}, "textSecondary");
  const dangerColor = useThemeColor({}, "stateErrorText");
  const dangerBackground = useThemeColor({}, "stateErrorBg");
  const warningBorder = useThemeColor({}, "stateWarningText");
  const warningBackground = useThemeColor({}, "stateWarningBg");
  const toggleBg = useThemeColor({}, "borderSubtle");
  const toggleActiveBg = useThemeColor({}, "brandPrimary");
  const textOnBrand = useThemeColor({}, "textOnBrand");
  const cardShadow = Elevation.low;
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
          <Button
            label="編集"
            onPress={() => setIsEditing(true)}
            disabled={isProcessing}
            variant="secondary"
          />
        ) : (
          <ThemedView style={styles.headerRow}>
            <Button
              label="キャンセル"
              onPress={() => setIsEditing(false)}
              disabled={isProcessing}
              variant="ghost"
            />
            <Button label="保存" onPress={handleSave} disabled={isProcessing} />
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView
        style={[
          styles.profileCard,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
          cardShadow,
        ]}
      >
        <ThemedView style={styles.profileHeader}>
          <ThemedView style={[styles.avatar, { backgroundColor: avatarBg }]}>
            {avatarUrl && !imageError ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <ThemedText style={[styles.avatarText, { color: textOnBrand }]}>
                {name ? name.charAt(0) : "U"}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={styles.profileCopy}>
            <ThemedText type="headline">{name || "User"}</ThemedText>
            <ThemedText type="caption" style={[styles.menuMeta, { color: menuMetaColor }]}>
              プロダクトメンバー
            </ThemedText>
            <ThemedText type="body">{email || "user@example.com"}</ThemedText>
          </ThemedView>
        </ThemedView>
        {isEditing ? (
          <ThemedView style={styles.section}>
            <Input
              label="Name"
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Email"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Avatar URL"
              placeholder="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
            />
          </ThemedView>
        ) : null}
      </ThemedView>

      <ThemedView
        style={[
          styles.menuCard,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
          cardShadow,
        ]}
      >
        <ThemedText type="headline" style={styles.cardTitle}>
          設定
        </ThemedText>
        <Pressable
          onPress={handleToggleNotifications}
          disabled={isProcessing}
          style={[styles.menuItem, { borderBottomColor: borderSubtle }]}
        >
          <ThemedText type="body">通知</ThemedText>
          <ThemedView
            style={[
              styles.toggle,
              { backgroundColor: toggleBg },
              notificationsEnabled && { backgroundColor: toggleActiveBg },
            ]}
          >
            <ThemedView
              style={[
                styles.toggleThumb,
                { backgroundColor: textOnBrand },
                notificationsEnabled && styles.toggleThumbActive,
              ]}
            />
          </ThemedView>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/notifications")}
          style={[styles.menuItem, { borderBottomColor: borderSubtle }]}
        >
          <ThemedText type="body">通知一覧</ThemedText>
        </Pressable>
        <Pressable onPress={handleLanguage} style={[styles.menuItem, { borderBottomColor: borderSubtle }]}>
          <ThemedText type="body">言語</ThemedText>
          <ThemedText type="caption" style={[styles.menuMeta, { color: menuMetaColor }]}>
            日本語
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/help")}
          style={[styles.menuItem, { borderBottomColor: borderSubtle }]}
        >
          <ThemedText type="body">ヘルプ</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          disabled={isProcessing}
          style={[styles.menuItem, { borderBottomColor: "transparent" }]}
        >
          <ThemedText style={[styles.dangerText, { color: dangerColor }]} type="body">
            ログアウト
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView
        style={[
          styles.menuCard,
          { backgroundColor: surfaceRaised, borderColor: borderSubtle },
          cardShadow,
        ]}
      >
        <ThemedText type="headline" style={styles.cardTitle}>
          Stats
        </ThemedText>
        <ThemedView style={styles.statsRow}>
          <ThemedView style={styles.statsItem}>
            <ThemedText type="headline">{stats.assigned}</ThemedText>
            <ThemedText type="caption" style={[styles.menuMeta, { color: menuMetaColor }]}>
              Assigned
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.statsItem}>
            <ThemedText type="headline">{stats.reported}</ThemedText>
            <ThemedText type="caption" style={[styles.menuMeta, { color: menuMetaColor }]}>
              Reported
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.statsItem}>
            <ThemedText type="headline">{stats.leading}</ThemedText>
            <ThemedText type="caption" style={[styles.menuMeta, { color: menuMetaColor }]}>
              Leading
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView
        style={[
          styles.menuCard,
          { backgroundColor: surfaceRaised, borderColor: warningBorder },
          cardShadow,
        ]}
      >
        <ThemedText type="headline" style={styles.cardTitle}>
          危険な操作
        </ThemedText>
        <ThemedView style={[styles.warningBox, { backgroundColor: warningBackground }]}>
          <ThemedText type="caption" style={{ color: dangerColor }}>
            リセットすると全てのプロジェクトと課題が削除されます。
          </ThemedText>
        </ThemedView>
        <Pressable
          onPress={handleReset}
          style={[styles.dangerButton, { backgroundColor: dangerBackground }]}
          disabled={isProcessing}
        >
          <ThemedText type="bodySemiBold" style={{ color: dangerColor }}>
            {isProcessing ? "処理中..." : "アプリを初期化する"}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  avatarText: {
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
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  dangerButton: {
    alignItems: "center",
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
  },
  dangerText: {},
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.l,
  },
  menuCard: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.s,
    paddingBottom: Spacing.s,
  },
  menuItem: {
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  menuMeta: {},
  profileCard: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.m,
    padding: Spacing.l,
  },
  profileCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  profileHeader: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  section: {
    gap: Spacing.s,
  },
  statsItem: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.l,
  },
  toggle: {
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 44,
  },
  toggleThumb: {
    borderRadius: 10,
    height: 20,
    marginLeft: 2,
    width: 20,
  },
  toggleThumbActive: {
    marginLeft: 22,
  },
  warningBox: {
    borderRadius: Radius.m,
    marginHorizontal: Spacing.l,
    padding: Spacing.m,
  },
});
