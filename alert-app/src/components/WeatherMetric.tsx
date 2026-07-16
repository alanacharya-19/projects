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
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: colors.cardAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={indicatorColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            fontWeight: "500",
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 18,
            color: colors.text,
            fontWeight: "700",
          }}
        >
          {value}
        </Text>
        <View
          style={{
            marginTop: 8,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.barTrack,
            overflow: "hidden",
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
    </View>
  );
};

export default React.memo(WeatherMetric);
