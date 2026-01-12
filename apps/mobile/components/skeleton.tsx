import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";

type SkeletonProps = {
  height?: number;
  width?: number | string;
};

export function Skeleton({ height = 16, width = "100%" }: SkeletonProps) {
  return <ThemedView style={[styles.skeleton, { height, width }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
});
