import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors: string[];
  style?: StyleProp<ViewStyle>;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors,
  style,
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
};

export default React.memo(GradientBackground);
