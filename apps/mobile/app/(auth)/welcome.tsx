import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.setItem("appInitialized", "true");
    router.replace("/(auth)/login");
  };

  const handleSkip = async () => {
    await AsyncStorage.multiSet([
      ["appInitialized", "true"],
      ["isLoggedIn", "true"],
    ]);
    router.replace("/(tabs)/home");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome</ThemedText>
      <ThemedText type="subtitle">
        Manage projects, collaborate with your team, and stay on top of tasks.
      </ThemedText>
      <ThemedView style={styles.actions}>
        <Pressable onPress={handleContinue}>
          <ThemedText type="link">Continue to login</ThemedText>
        </Pressable>
        <Pressable onPress={handleSkip}>
          <ThemedText type="link">Skip to app</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
