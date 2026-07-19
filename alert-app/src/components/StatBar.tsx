import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";

interface StatBarProps {
  label: string;
  value: string;
  maxValue: number;
  color?: string;
  colors: {
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    barTrack: string;
    accent: string;
  };
}

const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue,
  color,
  colors,
}) => {
  const scaleX = useRef(new Animated.Value(0)).current;
  const numericValue = parseFloat(value) || 0;
  const percentage = Math.min(numericValue / maxValue, 1);
  const barColor = color || colors.accent;

  useEffect(() => {
    Animated.timing(scaleX, {
      toValue: percentage,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percentage, scaleX]);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: -0.2,
          }}
        >
          {value}
        </Text>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.barTrack,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 3,
            backgroundColor: barColor,
            width: "100%",
            transformOrigin: "left",
            transform: [{ scaleX }],
          }}
        />
      </View>
    </View>
  );
};

export default React.memo(StatBar);
