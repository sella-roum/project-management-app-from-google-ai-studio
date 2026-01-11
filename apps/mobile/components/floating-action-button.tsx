import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

type FloatingActionButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function FloatingActionButton({
  onPress,
  accessibilityLabel,
  style,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <IconSymbol size={28} name="plus" color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 28,
    elevation: 6,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 56,
  },
  fabPressed: {
    opacity: 0.85,
  },
});
