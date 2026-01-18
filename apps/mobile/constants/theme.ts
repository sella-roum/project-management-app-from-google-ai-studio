/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#2563eb";
const tintColorDark = "#fff";
const brandPrimaryLight = "#2563eb";
const brandPrimaryDark = "#4fd1ff";
const brandSecondaryLight = "#9333ea";
const brandSecondaryDark = "#c4b5fd";

export const Colors = {
  light: {
    background: "#f9fafb",
    surfaceBase: "#f1f5f9",
    surfaceRaised: "#ffffff",
    surfaceOverlay: "#e2e8f0",
    text: "#0b1220",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#6b7280",
    textDisabled: "#9ca3af",
    textOnBrand: "#ffffff",
    tint: tintColorLight,
    brandPrimary: brandPrimaryLight,
    brandSecondary: brandSecondaryLight,
    icon: "#64748b",
    tabIconDefault: "#64748b",
    tabIconSelected: tintColorLight,
    borderSubtle: "#e2e8f0",
    borderStrong: "#cbd5e1",
    stateSuccessBg: "#dcfce7",
    stateSuccessText: "#15803d",
    stateWarningBg: "#fef3c7",
    stateWarningText: "#b45309",
    stateErrorBg: "#fee2e2",
    stateErrorText: "#b91c1c",
    stateInfoBg: "#dbeafe",
    stateInfoText: "#1d4ed8",
  },
  dark: {
    background: "#151718",
    surfaceBase: "#0f172a",
    surfaceRaised: "#111827",
    surfaceOverlay: "#1f2937",
    text: "#ECEDEE",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textTertiary: "#94a3b8",
    textDisabled: "#64748b",
    textOnBrand: "#ffffff",
    tint: tintColorDark,
    brandPrimary: brandPrimaryDark,
    brandSecondary: brandSecondaryDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    borderSubtle: "#1f2937",
    borderStrong: "#334155",
    stateSuccessBg: "#14532d",
    stateSuccessText: "#86efac",
    stateWarningBg: "#78350f",
    stateWarningText: "#fcd34d",
    stateErrorBg: "#7f1d1d",
    stateErrorText: "#fecaca",
    stateInfoBg: "#1e3a8a",
    stateInfoText: "#bfdbfe",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Radius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  "2xl": 32,
};

export const Elevation = {
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  high: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
};
