import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const backgroundPrimary = useThemeColor({}, "brandPrimary");
  const backgroundSecondary = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const textPrimary = useThemeColor({}, "textPrimary");
  const textOnPrimary = useThemeColor({}, "surfaceRaised");

  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      backgroundColor: backgroundPrimary,
      borderColor: "transparent",
      textColor: textOnPrimary,
    },
    secondary: {
      backgroundColor: backgroundSecondary,
      borderColor: borderSubtle,
      textColor: textPrimary,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: backgroundPrimary,
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        if (!onPress) return;
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          transform: pressed ? [{ scale: 0.98 }] : undefined,
          width: fullWidth ? "100%" : "auto",
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <ThemedText style={{ color: variantStyles.textColor }} type="bodySemiBold">
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: Radius.m,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
  },
});
