import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { getCurrentUser, getUserStats, reset, updateUser } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function ProfileScreen() {
  const ready = useStorageReady();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState({ assigned: 0, reported: 0, leading: 0 });

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const user = await getCurrentUser();
      if (user) {
        setName(user.name);
        setEmail(user.email ?? "");
        const data = await getUserStats(user.id);
        setStats(data);
      }
    };
    void load();
  }, [ready]);

  const handleSave = async () => {
    const user = await getCurrentUser();
    if (!user) return;
    await updateUser(user.id, { name, email });
  };

  const handleReset = async () => {
    await reset();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText type="subtitle">Account</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <Pressable onPress={handleSave} style={styles.primaryButton}>
        <ThemedText type="link">Save profile</ThemedText>
      </Pressable>
      <ThemedText type="subtitle">Stats</ThemedText>
      <ThemedText>Assigned issues: {stats.assigned}</ThemedText>
      <ThemedText>Reported issues: {stats.reported}</ThemedText>
      <ThemedText>Leading projects: {stats.leading}</ThemedText>
      <Pressable onPress={handleReset} style={styles.dangerButton}>
        <ThemedText type="link">Reset local data</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
});
