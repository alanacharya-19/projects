import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

export function SectionHeader({ title, subtitle, onSeeAll, seeAllLabel = "See All" }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={styles.seeAll} hitSlop={8}>
          <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accent.secondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  left: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xxs,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  seeAllText: {
    color: colors.accent.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
