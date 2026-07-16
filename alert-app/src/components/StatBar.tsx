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
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percentage, scaleX]);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {value}
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.barTrack,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 4,
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
