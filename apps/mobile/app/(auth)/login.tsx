import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function LoginScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.multiSet([
      ["isLoggedIn", "true"],
      ["appInitialized", "true"],
    ]);
    router.replace("/(tabs)/home");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Log in</ThemedText>
      <ThemedText type="default">
        Authentication UI will go here. For now, continue to the app shell.
      </ThemedText>
      <Pressable onPress={handleContinue}>
        <ThemedText type="link">Go to dashboard</ThemedText>
      </Pressable>
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
});
