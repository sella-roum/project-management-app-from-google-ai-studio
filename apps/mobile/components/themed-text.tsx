import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "defaultSemiBold"
    | "display"
    | "title"
    | "headline"
    | "subtitle"
    | "body"
    | "bodySemiBold"
    | "caption"
    | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    "textPrimary",
  );
  const linkColor = useThemeColor({}, "brandPrimary");

  return (
    <Text
      style={[
        { color },
        type === "display" ? styles.display : undefined,
        type === "title" ? styles.title : undefined,
        type === "headline" ? styles.headline : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "default" ? styles.body : undefined,
        type === "body" ? styles.body : undefined,
        type === "defaultSemiBold" ? styles.bodySemiBold : undefined,
        type === "bodySemiBold" ? styles.bodySemiBold : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "link" ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  headline: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "600",
  },
});
