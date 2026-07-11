import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardRow}>
        <SkeletonBlock width={100} height={100} borderRadius={10} />
        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <SkeletonBlock width={60} height={14} borderRadius={4} />
            <SkeletonBlock width={40} height={14} borderRadius={4} />
          </View>
          <SkeletonBlock width="100%" height={16} borderRadius={4} style={{ marginTop: 10 }} />
          <SkeletonBlock width="70%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
          <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
            <SkeletonBlock width={60} height={14} borderRadius={4} />
            <SkeletonBlock width={28} height={28} borderRadius={14} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function TrendingSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.trendingWrap}>
      <View style={styles.trendingHeader}>
        <SkeletonBlock width={24} height={24} borderRadius={12} />
        <SkeletonBlock width={90} height={18} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.trendingCard}>
        <View style={[styles.trendingOverlay, { backgroundColor: colors.skeleton }]}>
          <View style={styles.trendingContent}>
            <SkeletonBlock width={70} height={20} borderRadius={6} />
            <SkeletonBlock width="80%" height={20} borderRadius={4} style={{ marginTop: 10 }} />
            <SkeletonBlock width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>
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
  cardRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  trendingWrap: {
    marginBottom: 8,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    marginTop: 8,
  },
  trendingCard: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trendingOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  trendingContent: {
    padding: 20,
  },
});
