import { StyleSheet, View, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type ChipVariant = "solid" | "outline";

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  style?: ViewStyle;
};

export function Chip({
  label,
  variant = "outline",
  backgroundColor,
  borderColor,
  textColor,
  style,
}: ChipProps) {
  const defaultBorder = useThemeColor({}, "borderSubtle");
  const defaultSolidBg = useThemeColor({}, "surfaceRaised");
  const defaultText = useThemeColor({}, "textSecondary");

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor:
            variant === "solid" ? backgroundColor ?? defaultSolidBg : "transparent",
          borderColor: borderColor ?? defaultBorder,
        },
        style,
      ]}
    >
      <ThemedText
        type="caption"
        numberOfLines={1}
        style={[styles.text, { color: textColor ?? defaultText }]}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: Radius.l,
    borderWidth: 1,
    minHeight: 24,
    justifyContent: "center",
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
  },
});
