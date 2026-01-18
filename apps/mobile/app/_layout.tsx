import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Platform, StyleSheet, UIManager, View } from "react-native";

import { SetupWizard } from "@/components/setup-wizard";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const modalBackdropColor = useThemeColor({}, "stateInfoBg");

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

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          animation: "default",
          animationDuration: 250,
        }}
      >
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
        onRequestClose={() => {}}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: modalBackdropColor }]}>
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
  },
});
