import React, { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  colors: typeof COLORS.dark;
}

function ProgressBarComponent({
  position,
  duration,
  onSeek,
  colors,
}: ProgressBarProps) {
  const barWidthRef = useRef(0);
  const progress = duration > 0 ? position / duration : 0;

  const onLayout = useCallback((e: any) => {
    barWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const handlePress = useCallback((e: any) => {
    const x = e.nativeEvent?.locationX ?? 0;
    if (duration > 0 && barWidthRef.current > 0) {
      onSeek(x / barWidthRef.current);
    }
  }, [duration, onSeek]);

  return (
    <View style={styles.hitArea}>
      <Pressable
        style={[styles.container, { backgroundColor: colors.progressBackground }]}
        onLayout={onLayout}
        onPress={handlePress}
      >
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.progressFill, width: `${progress * 100}%` },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { paddingVertical: 8, cursor: 'pointer' },
  container: { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 2 },
});

export const ProgressBar = memo(ProgressBarComponent);
