import { Pressable, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type SortKey = "updated" | "created" | "priority";

export type SortOption = {
  key: SortKey;
  label: string;
};

type SearchSortRowProps = {
  sortKey: SortKey;
  sortOptions: SortOption[];
  onSortChange: (key: SortKey) => void;
};

export function SearchSortRow({
  sortKey,
  sortOptions,
  onSortChange,
}: SearchSortRowProps) {
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const activeBg = useThemeColor({}, "stateInfoBg");
  const activeBorder = useThemeColor({}, "brandPrimary");
  const metaTextColor = useThemeColor({}, "textSecondary");
  const activeText = useThemeColor({}, "stateInfoText");
  const inactiveText = useThemeColor({}, "textSecondary");

  return (
    <ThemedView style={styles.sortRow}>
      <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
        並び替え
      </ThemedText>
      <ThemedView style={styles.sortOptions}>
        {sortOptions.map((option) => {
          const isActive = sortKey === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSortChange(option.key)}
              style={[
                styles.sortChip,
                { borderColor: borderSubtle },
                isActive && { borderColor: activeBorder, backgroundColor: activeBg },
              ]}
            >
              <View style={styles.chipContent}>
                {isActive ? (
                  <MaterialIcons name="check" size={16} color={activeText} />
                ) : null}
                <ThemedText type="caption" style={{ color: isActive ? activeText : inactiveText }}>
                  {option.label}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chipContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
  },
  sortChip: {
    borderRadius: Radius.l,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  sortRow: {
    gap: Spacing.s,
  },
});
