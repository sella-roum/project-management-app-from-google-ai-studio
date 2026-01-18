import { StyleSheet, type DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

type SkeletonProps = {
  height?: number;
  width?: DimensionValue;
};

export function Skeleton({ height = 16, width = "100%" }: SkeletonProps) {
  const base = useThemeColor({}, "surfaceOverlay");
  const highlight = useThemeColor({}, "brandSecondary");
  return (
    <ThemedView style={[styles.skeleton, { height, width }]}>
      <LinearGradient
        colors={[base, highlight, base]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 8,
    overflow: "hidden",
  },
});
