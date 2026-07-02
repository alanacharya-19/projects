import React, { memo, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { SongThumbnail } from './SongThumbnail';

interface AlbumArtProps {
  uri: string | null;
  size?: number;
  rotation?: boolean;
  isPlaying?: boolean;
  seed?: string;
}

function AlbumArtComponent({
  uri,
  size = SIZES.albumArtLarge,
  rotation = false,
  isPlaying = false,
  seed = 'default',
}: AlbumArtProps) {
  const { colors } = useThemeContext();
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying && rotation) {
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(ringRotation);
    }
  }, [isPlaying, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const artStyle = useAnimatedStyle(() => {
    if (!rotation || !isPlaying) return {};
    return {
      transform: [
        {
          rotate: withRepeat(
            withTiming('360deg', {
              duration: 8000,
              easing: Easing.linear,
            }),
            -1,
            false
          ),
        },
      ],
    };
  });

  const r = size / 2;

  return (
    <View style={{ width: size + 16, height: size + 16, justifyContent: 'center', alignItems: 'center' }}>
      {/* Animated outer ring */}
      <Animated.View
        style={[
          ringStyle,
          {
            position: 'absolute',
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            borderWidth: 3,
            borderColor: 'transparent',
            borderTopColor: colors.primary,
            borderRightColor: colors.primary + '44',
            borderBottomColor: colors.primary + '22',
            borderLeftColor: colors.primary + '11',
            opacity: isPlaying && rotation ? 1 : 0,
          },
        ]}
      />
      {/* Artwork */}
      <View style={[styles.container, { width: size, height: size, borderRadius: r }]}>
        <Animated.View style={[styles.imageWrapper, { borderRadius: r }, artStyle]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={[styles.image, { width: size, height: size, borderRadius: r }]}
            />
          ) : (
            <SongThumbnail seed={seed} size={size} style={{ borderRadius: r }} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {},
});

export const AlbumArt = memo(AlbumArtComponent);
