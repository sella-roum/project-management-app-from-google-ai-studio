import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import type { Notification } from "@repo/core";
import { getNotifications, markAllNotificationsRead } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function NotificationsScreen() {
  const ready = useStorageReady();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };
    void load();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const markRead = async () => {
      await markAllNotificationsRead();
    };
    void markRead();
  }, [ready]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Notifications</ThemedText>
      {!ready ? (
        <ThemedText>Loading notifications...</ThemedText>
      ) : notifications.length === 0 ? (
        <ThemedText>No notifications yet.</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {notifications.map((notification) => (
            <ThemedView key={notification.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">
                {notification.title}
              </ThemedText>
              <ThemedText>{notification.description}</ThemedText>
              <ThemedText>
                {notification.read ? "Read" : "Unread"} •{" "}
                {new Date(notification.createdAt).toLocaleString()}
              </ThemedText>
            </ThemedView>
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
  container: {
    gap: 12,
    padding: 24,
  },
  list: {
    gap: 12,
  },
});
