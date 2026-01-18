import { useCallback, useEffect, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import type { Notification } from "@repo/core";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function NotificationsScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadBackground = useThemeColor({}, "stateInfoBg");
  const iconBackground = useThemeColor({}, "surfaceOverlay");
  const metaTextColor = useThemeColor({}, "textSecondary");
  const accentColor = useThemeColor({}, "brandPrimary");
  const surfaceRaised = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const iconDefault = useThemeColor({}, "textTertiary");
  const unreadTextColor = useThemeColor({}, "brandPrimary");
  const warningColor = useThemeColor({}, "stateWarningText");
  const chipInfoBg = useThemeColor({}, "stateInfoBg");
  const chipInfoText = useThemeColor({}, "stateInfoText");
  const chipWarningBg = useThemeColor({}, "stateWarningBg");
  const chipWarningText = useThemeColor({}, "stateWarningText");
  const chipNeutralBorder = useThemeColor({}, "borderSubtle");
  const toastBackground = useThemeColor({}, "stateInfoBg");
  const toastText = useThemeColor({}, "stateInfoText");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const load = async () => {
      const data = await getNotifications();
      if (!active) return;
      setNotifications(data);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [notifications.length]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 1000);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications();
    setToastMessage("すべて既読にしました");
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setToastMessage("通知を既読にしました");
    }
    if (notification.issueId) {
      router.push(`/issue/${notification.issueId}`);
    }
    await loadNotifications();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "mention":
        return (
          <MaterialIcons name="chat-bubble-outline" size={18} color={accentColor} />
        );
      case "assignment":
        return <MaterialIcons name="person-add-alt" size={18} color={warningColor} />;
      default:
        return <MaterialIcons name="notifications" size={18} color={iconDefault} />;
    }
  };

  type PriorityChip = {
    label: string;
    variant: "solid" | "outline";
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };

  const getPriorityLabel = (type: Notification["type"]): PriorityChip => {
    if (type === "assignment") {
      return {
        label: "高",
        variant: "solid",
        backgroundColor: chipWarningBg,
        textColor: chipWarningText,
        borderColor: chipWarningBg,
      };
    }
    if (type === "mention") {
      return {
        label: "中",
        variant: "solid",
        backgroundColor: chipInfoBg,
        textColor: chipInfoText,
        borderColor: chipInfoBg,
      };
    }
    return {
      label: "低",
      variant: "outline",
      borderColor: chipNeutralBorder,
      textColor: metaTextColor,
    };
  };

  return (
    <ThemedView style={styles.screen}>
      {toastMessage ? (
        <ThemedView style={[styles.toast, { backgroundColor: toastBackground }]}>
          <ThemedText type="caption" style={{ color: toastText }}>
            {toastMessage}
          </ThemedText>
        </ThemedView>
      ) : null}
      <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Notifications</ThemedText>
        <Button
          label="すべて既読にする"
          onPress={handleMarkAllRead}
          variant="ghost"
          disabled={notifications.every((notification) => notification.read)}
        />
      </ThemedView>
      {!ready ? (
        <ThemedText type="body">Loading notifications...</ThemedText>
      ) : notifications.length === 0 ? (
        <ThemedText type="body">No notifications yet.</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
            >
              <ThemedView style={styles.cardHeaderRow}>
                <Chip {...getPriorityLabel(notification.type)} />
                {!notification.read ? (
                  <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />
                ) : null}
              </ThemedView>
              <ThemedView
                style={[
                  styles.card,
                  { backgroundColor: surfaceRaised, borderColor: borderSubtle },
                  !notification.read && { backgroundColor: unreadBackground },
                ]}
              >
                <View style={styles.row}>
                  <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
                    {getIcon(notification.type)}
                  </View>
                  <ThemedView style={styles.cardBody}>
                    <ThemedText
                      type={notification.read ? "bodySemiBold" : "headline"}
                      style={!notification.read ? { color: unreadTextColor } : undefined}
                    >
                      {notification.title}
                    </ThemedText>
                    <ThemedText type="body">{notification.description}</ThemedText>
                    <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
                      {formatTimestamp(notification.createdAt)}
                    </ThemedText>
                  </ThemedView>
                </View>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.l,
    borderWidth: 1,
    gap: Spacing.s,
    padding: Spacing.l,
    ...Elevation.low,
  },
  cardBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  container: {
    gap: Spacing.m,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconCircle: {
    alignItems: "center",
    borderRadius: Radius.m,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  list: {
    gap: Spacing.m,
  },
  metaText: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  screen: {
    flex: 1,
  },
  toast: {
    alignSelf: "center",
    borderRadius: Radius.l,
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    position: "absolute",
    top: 0,
    zIndex: 10,
  },
  unreadDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
