import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonCardColors {
  surface: string;
  surfaceVariant: string;
  border: string;
}

interface SkeletonCardProps {
  colors: SkeletonCardColors;
}

export default function SkeletonCard({ colors }: SkeletonCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.surfaceVariant, opacity: pulseAnim },
          ]}
        />
        <View style={styles.textLines}>
          <Animated.View
            style={[
              styles.textLine,
              styles.textLineLong,
              { backgroundColor: colors.surfaceVariant, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.textLine,
              styles.textLineShort,
              { backgroundColor: colors.surfaceVariant, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: colors.surfaceVariant, opacity: pulseAnim },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textLines: {
    flex: 1,
    gap: 8,
  },
  textLine: {
    height: 14,
    borderRadius: 7,
  },
  textLineLong: {
    width: '80%',
  },
  textLineShort: {
    width: '50%',
  },
  button: {
    height: 40,
    borderRadius: 10,
  },
});
