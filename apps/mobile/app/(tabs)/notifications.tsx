import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { useStorageReady } from "@/hooks/use-storage";

export default function NotificationsScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    if (notification.issueId) {
      router.push(`/issue/${notification.issueId}`);
    }
    await loadNotifications();
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "mention":
        return <MaterialIcons name="chat-bubble-outline" size={18} color="#2563eb" />;
      case "assignment":
        return <MaterialIcons name="person-add-alt" size={18} color="#f97316" />;
      default:
        return <MaterialIcons name="notifications" size={18} color="#6b7280" />;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Notifications</ThemedText>
        <Pressable
          onPress={handleMarkAllRead}
          disabled={notifications.every((notification) => notification.read)}
          style={[
            styles.linkButton,
            notifications.every((notification) => notification.read) &&
              styles.linkButtonDisabled,
          ]}
        >
          <ThemedText>すべて既読にする</ThemedText>
        </Pressable>
      </ThemedView>
      {!ready ? (
        <ThemedText>Loading notifications...</ThemedText>
      ) : notifications.length === 0 ? (
        <ThemedText>No notifications yet.</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
            >
              <ThemedView
                style={[
                  styles.card,
                  !notification.read && styles.cardUnread,
                ]}
              >
                <View style={styles.row}>
                  <View style={styles.iconCircle}>
                    {getIcon(notification.type)}
                  </View>
                  <ThemedView style={styles.cardBody}>
                    <ThemedText type="defaultSemiBold">
                      {notification.title}
                    </ThemedText>
                    <ThemedText>{notification.description}</ThemedText>
                    <ThemedText style={styles.metaText}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </ThemedText>
                  </ThemedView>
                  {!notification.read ? <View style={styles.unreadDot} /> : null}
                </View>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardUnread: {
    backgroundColor: "#eff6ff",
  },
  container: {
    gap: 12,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkButtonDisabled: {
    opacity: 0.4,
  },
  list: {
    gap: 12,
  },
  metaText: {
    color: "#6b7280",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  unreadDot: {
    backgroundColor: "#2563eb",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
