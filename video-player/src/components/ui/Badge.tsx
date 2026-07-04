import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface BadgeProps {
  label: string;
  variant?: "default" | "hdr" | "dolby" | "4k" | "hd" | "audio";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({ label, variant = "default", size = "sm", icon, style }: BadgeProps) {
  const badgeColor = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        styles[`size_${size}`],
        { backgroundColor: badgeColor.bg, borderColor: badgeColor.border },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          styles[`labelSize_${size}`],
          { color: badgeColor.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const variantColors = {
  default: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.15)", text: colors.text.secondary },
  hdr: { bg: "rgba(253,203,110,0.15)", border: "rgba(253,203,110,0.3)", text: colors.badge.hdr },
  dolby: { bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.3)", text: colors.text.primary },
  "4k": { bg: "rgba(225,112,85,0.15)", border: "rgba(225,112,85,0.3)", text: colors.badge["4k"] },
  hd: { bg: "rgba(116,185,255,0.15)", border: "rgba(116,185,255,0.3)", text: colors.badge.hd },
  audio: { bg: "rgba(108,92,231,0.15)", border: "rgba(108,92,231,0.3)", text: colors.accent.secondary },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: borderRadius.xs,
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  size_md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  labelSize_sm: {
    fontSize: typography.sizes.xs,
  },
  labelSize_md: {
    fontSize: typography.sizes.sm,
  },
});
