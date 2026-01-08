import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import type { Notification } from "@repo/core";
import { getNotifications, markAllNotificationsRead } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function NotificationsScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const load = async () => {
      const data = await getNotifications();
      if (!active) return;
      setNotifications(data);
      await markAllNotificationsRead();
      if (!active) return;
      setNotifications((current) =>
        current.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        ),
      );
    };
    void load();
    return () => {
      active = false;
    };
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
            <Pressable
              key={notification.id}
              onPress={
                notification.issueId
                  ? () => router.push(`/issue/${notification.issueId}`)
                  : undefined
              }
              disabled={!notification.issueId}
            >
              <ThemedView style={styles.card}>
                <ThemedText type="defaultSemiBold">
                  {notification.title}
                </ThemedText>
                <ThemedText>{notification.description}</ThemedText>
                <ThemedText>
                  {notification.read ? "Read" : "Unread"} •{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </ThemedText>
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
  container: {
    gap: 12,
    padding: 24,
  },
  list: {
    gap: 12,
  },
});
