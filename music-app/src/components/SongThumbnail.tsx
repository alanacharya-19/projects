import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColorsFromSeed, getInitials } from '../utils/colorFromString';
import { SIZES } from '../constants/theme';

const LAYOUTS = ['split-diagonal', 'circle', 'bars', 'dots'] as const;

interface SongThumbnailProps {
  seed: string;
  size?: number;
  style?: any;
}

function SongThumbnailComponent({ seed, size = 44, style }: SongThumbnailProps) {
  const colors = useMemo(() => getColorsFromSeed(seed), [seed]);
  const initials = useMemo(() => getInitials(seed), [seed]);
  const layout = useMemo(() => LAYOUTS[seed.length % LAYOUTS.length], [seed]);

  const r = size / 2;

  if (layout === 'split-diagonal') {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.15, backgroundColor: colors.bg, overflow: 'hidden' }, style]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent, transform: [{ rotate: '-25deg' }, { translateX: -size * 0.3 }, { translateY: -size * 0.1 }], width: size * 1.2, height: size * 0.6 }]} />
        <Text style={[styles.initials, { fontSize: size * 0.35, color: colors.text }]}>{initials}</Text>
      </View>
    );
  }

  if (layout === 'circle') {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.15, backgroundColor: colors.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
        <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.initials, { fontSize: size * 0.3, color: colors.text }]}>{initials}</Text>
        </View>
      </View>
    );
  }

  if (layout === 'bars') {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.15, backgroundColor: colors.bg, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: size * 0.08, paddingBottom: size * 0.15 }, style]}>
        <View style={{ width: size * 0.12, height: size * 0.4, borderRadius: 2, backgroundColor: colors.accent }} />
        <View style={{ width: size * 0.12, height: size * 0.6, borderRadius: 2, backgroundColor: colors.accent }} />
        <View style={{ width: size * 0.12, height: size * 0.5, borderRadius: 2, backgroundColor: colors.accent }} />
        <Ionicons name="musical-note" size={size * 0.25} color={colors.text} style={{ position: 'absolute', bottom: size * 0.08, right: size * 0.08, opacity: 0.5 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.15, backgroundColor: colors.bg, overflow: 'hidden' }, style]}>
      <View style={{ position: 'absolute', top: -size * 0.15, right: -size * 0.15, width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: colors.accent, opacity: 0.6 }} />
      <View style={{ position: 'absolute', bottom: -size * 0.1, left: -size * 0.1, width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25, backgroundColor: colors.accent, opacity: 0.4 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="musical-note" size={size * 0.35} color={colors.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});

export const SongThumbnail = React.memo(SongThumbnailComponent);
