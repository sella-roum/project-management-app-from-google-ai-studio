import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Elevation } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  const fabBackground = useThemeColor({}, "brandPrimary");
  const iconColor = useThemeColor({}, "textOnBrand");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        Elevation.medium,
        { backgroundColor: fabBackground },
        pressed && styles.fabPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <IconSymbol size={28} name="plus" color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    width: 56,
  },
  fabPressed: {
    opacity: 0.85,
  },
});
