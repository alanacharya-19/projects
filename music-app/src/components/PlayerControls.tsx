import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../constants/theme';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFastForward: () => void;
  onRewind: () => void;
  colors: typeof COLORS.dark;
  size?: 'small' | 'large';
}

function PlayerControlsComponent({
  isPlaying,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onFastForward,
  onRewind,
  colors,
  size = 'large',
}: PlayerControlsProps) {
  const scale = useSharedValue(1);

  const playButtonScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePlayPress = () => {
    scale.value = withSequence(
      withSpring(0.9),
      withSpring(1)
    );
    onTogglePlayPause();
  };

  const isLarge = size === 'large';
  const mainButtonSize = isLarge ? 72 : 48;
  const iconSize = isLarge ? 24 : 18;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onPrevious} style={styles.sideButton}>
          <Ionicons name="play-skip-back" size={isLarge ? 26 : 20} color={colors.text} />
        </TouchableOpacity>

        <Animated.View style={[styles.playButtonContainer, playButtonScale]}>
          <TouchableOpacity
            onPress={handlePlayPress}
            style={[
              styles.playButton,
              {
                width: mainButtonSize,
                height: mainButtonSize,
                borderRadius: mainButtonSize / 2,
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={iconSize}
              color="#000"
              style={isPlaying ? undefined : { marginLeft: 3 }}
            />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={onNext} style={styles.sideButton}>
          <Ionicons name="play-skip-forward" size={isLarge ? 26 : 20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.padding,
  },
  sideButton: { padding: SIZES.paddingSmall },
  playButtonContainer: { marginHorizontal: SIZES.padding },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export const PlayerControls = memo(PlayerControlsComponent);
