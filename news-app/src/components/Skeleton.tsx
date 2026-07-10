import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.skeleton, opacity }, style]}
    />
  );
}

export function ArticleSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={styles.top}>
        <View style={styles.metaRow}>
          <SkeletonBlock width={60} height={14} borderRadius={4} />
          <SkeletonBlock width={40} height={14} borderRadius={4} />
        </View>
        <SkeletonBlock width="100%" height={18} borderRadius={4} style={{ marginTop: 10 }} />
        <SkeletonBlock width="75%" height={18} borderRadius={4} style={{ marginTop: 6 }} />
        <SkeletonBlock width={80} height={14} borderRadius={4} style={{ marginTop: 10 }} />
      </View>
      <View style={[styles.bottom, { borderTopColor: colors.border }]}>
        <SkeletonBlock width={60} height={14} borderRadius={4} />
        <SkeletonBlock width={28} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

export function TrendingSkeleton() {
  return (
    <View style={styles.trendingCard}>
      <SkeletonBlock width="100%" height={200} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  top: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  trendingCard: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
