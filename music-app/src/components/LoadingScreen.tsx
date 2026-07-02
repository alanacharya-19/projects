import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
  colors?: typeof COLORS.dark;
}

export function LoadingScreen({
  message = 'Loading...',
  colors = COLORS.dark,
}: LoadingScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: SIZES.padding,
    fontSize: SIZES.fontLarge,
  },
});
