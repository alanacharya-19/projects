import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: any;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function LottieAnimation({
  source,
  size = 120,
  autoPlay = true,
  loop = true,
  style,
}: LottieAnimationProps) {
  return (
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={[{ width: size, height: size }, style]}
    />
  );
}
