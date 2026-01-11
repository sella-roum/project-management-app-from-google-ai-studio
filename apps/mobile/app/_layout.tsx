import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { SetupWizard } from "@/components/setup-wizard";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSetup = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          "isLoggedIn",
          "hasSetup",
        ]);
        if (!active) return;
        const values = new Map(entries);
        const isLoggedIn = values.get("isLoggedIn") === "true";
        const hasSetup = values.get("hasSetup") === "true";
        const isAuthFlow =
          segments.includes("(auth)") || segments.includes("setup");
        setShowSetupWizard(isLoggedIn && !hasSetup && !isAuthFlow);
      } catch (error) {
        console.error("Failed to load setup state", error);
        if (active) {
          setShowSetupWizard(false);
        }
      }
    };
    void checkSetup();
    return () => {
      active = false;
    };
  }, [segments]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="issue/[issueId]" options={{ title: "Issue" }} />
        <Stack.Screen name="project/[projectId]" options={{ title: "Project" }} />
        <Stack.Screen name="projects/[projectId]" options={{ title: "Project" }} />
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <Modal
        visible={showSetupWizard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSetupWizard(true)}
      >
        <View style={styles.modalBackdrop}>
          <SetupWizard onComplete={handleSetupComplete} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#1e3a8a",
  },
});
