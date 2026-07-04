import { forwardRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button = forwardRef<any, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = "primary",
      size = "md",
      icon,
      loading,
      disabled,
      style,
      textStyle,
      accessibilityLabel,
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        style={[
          styles.base,
          styles[variant],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? colors.text.inverse : colors.accent.primary}
          />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                styles[`text_${variant}`],
                styles[`textSize_${size}`],
                icon ? { marginLeft: spacing.sm } : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
  },
  primary: {
    backgroundColor: colors.accent.primary,
  },
  secondary: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  glass: {
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  size_md: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
  },
  size_lg: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing["4xl"],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.semibold,
  },
  text_primary: {
    color: colors.text.inverse,
  },
  text_secondary: {
    color: colors.text.primary,
  },
  text_ghost: {
    color: colors.accent.primary,
  },
  text_glass: {
    color: colors.text.primary,
  },
  textSize_sm: {
    fontSize: typography.sizes.sm,
  },
  textSize_md: {
    fontSize: typography.sizes.base,
  },
  textSize_lg: {
    fontSize: typography.sizes.md,
  },
});
