import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
  colors: typeof COLORS.dark;
}

function EmptyStateComponent({
  title,
  message,
  icon = '♪',
  colors,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: colors.textTertiary }]}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {message && (
        <Text style={[styles.message, { color: colors.textTertiary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 64,
    marginBottom: SIZES.padding,
    opacity: 0.5,
  },
  title: {
    fontSize: SIZES.fontXLarge,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  message: {
    fontSize: SIZES.fontMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export const EmptyState = memo(EmptyStateComponent);
