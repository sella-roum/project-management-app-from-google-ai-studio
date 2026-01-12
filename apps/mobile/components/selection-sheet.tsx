import { Modal, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type SelectionOption = {
  label: string;
  value: string;
};

type SelectionSheetProps = {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function SelectionSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: SelectionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <ThemedView style={styles.overlay}>
        <ThemedView style={styles.sheet}>
          <ThemedText type="subtitle">{title}</ThemedText>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelect(option.value);
              }}
              style={styles.option}
            >
              <ThemedText>{option.label}</ThemedText>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.secondaryButton}>
            <ThemedText>閉じる</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  secondaryButton: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
    padding: 20,
  },
});
