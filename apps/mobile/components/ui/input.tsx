import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    style,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const textPrimary = useThemeColor({}, "textPrimary");
  const textTertiary = useThemeColor({}, "textTertiary");
  const errorBorder = useThemeColor({}, "stateErrorText");
  const errorTextColor = useThemeColor({}, "stateErrorText");
  const helperTextColor = useThemeColor({}, "textSecondary");
  const borderColor = errorText ? errorBorder : isFocused ? brandPrimary : borderSubtle;

  return (
    <ThemedView style={styles.wrapper}>
      {label ? (
        <ThemedText type="caption" style={[styles.label, { color: textTertiary }]}>
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        {...props}
        ref={ref}
        accessibilityLabel={props.accessibilityLabel ?? label}
        style={[
          styles.input,
          { borderColor, color: textPrimary },
          props.editable === false && { opacity: 0.5 },
          style,
        ]}
        placeholderTextColor={textTertiary}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
      />
      {errorText ? (
        <ThemedText type="caption" style={[styles.error, { color: errorTextColor }]}>
          {errorText}
        </ThemedText>
      ) : helperText ? (
        <ThemedText type="caption" style={[styles.helper, { color: helperTextColor }]}>
          {helperText}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  helper: {
    fontSize: 12,
  },
  error: {
    fontSize: 12,
  },
});
