import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius } from "../../theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadiusVal?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 20, borderRadiusVal = borderRadius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as any,
          height,
          borderRadius: borderRadiusVal,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={160} borderRadiusVal={borderRadius.lg} />
      <View style={styles.cardBody}>
        <Skeleton width="80%" height={14} />
        <View style={styles.cardMeta}>
          <Skeleton width="30%" height={10} />
          <Skeleton width="20%" height={10} />
        </View>
      </View>
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View style={styles.hero}>
      <Skeleton height={220} borderRadiusVal={borderRadius.xl} />
      <View style={styles.heroBody}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="90%" height={14} />
        <View style={styles.heroMeta}>
          <Skeleton width={60} height={10} />
          <Skeleton width={80} height={10} />
          <Skeleton width={50} height={10} />
        </View>
      </View>
    </View>
  );
}

export function SectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Skeleton width={120} height={18} />
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.sectionRow}>
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bg.elevated,
  },
  card: {
    width: 140,
    marginRight: 12,
  },
  cardBody: {
    marginTop: 8,
    gap: 6,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 8,
  },
  hero: {
    marginBottom: 24,
  },
  heroBody: {
    marginTop: 12,
    gap: 8,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
  },
});
