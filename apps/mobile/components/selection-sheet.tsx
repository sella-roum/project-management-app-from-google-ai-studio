import { Modal, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type SelectionOption = {
  label: string;
  value: string;
};

type SelectionSheetProps = {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function SelectionSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectionSheetProps) {
  const sheetBackground = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const selectedBackground = useThemeColor({}, "stateInfoBg");
  const selectedBorder = useThemeColor({}, "brandPrimary");
  const selectedText = useThemeColor({}, "brandPrimary");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <ThemedView style={styles.overlay}>
        <ThemedView style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <ThemedText type="headline">{title}</ThemedText>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelect(option.value);
              }}
              style={[
                styles.option,
                {
                  borderColor:
                    option.value === selectedValue ? selectedBorder : borderSubtle,
                  backgroundColor:
                    option.value === selectedValue ? selectedBackground : "transparent",
                },
              ]}
            >
              <ThemedText
                type="body"
                style={
                  option.value === selectedValue ? { color: selectedText } : undefined
                }
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
          <Button label="閉じる" onPress={onClose} variant="secondary" fullWidth />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: Radius.m,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  sheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    gap: Spacing.m,
    padding: Spacing.l,
  },
});
