import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WeatherMetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    icon: string;
    accent: string;
    barTrack: string;
  };
}

const WeatherMetric: React.FC<WeatherMetricProps> = ({
  icon,
  label,
  value,
  color,
  colors,
}) => {
  const indicatorColor = color || colors.accent;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 18,
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: indicatorColor + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={indicatorColor} />
      </View>

      <Text
        style={{
          fontSize: 22,
          color: colors.text,
          fontWeight: "700",
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          fontSize: 12,
          color: colors.textMuted,
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          width: "100%",
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.barTrack,
          overflow: "hidden",
          marginTop: 2,
        }}
      >
        <View
          style={{
            width: "65%",
            height: "100%",
            borderRadius: 2,
            backgroundColor: indicatorColor,
          }}
        />
      </View>
    </View>
  );
};

export default React.memo(WeatherMetric);
