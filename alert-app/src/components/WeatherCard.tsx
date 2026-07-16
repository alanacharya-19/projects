import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WeatherCardProps {
  temperature: number;
  condition: string;
  icon: keyof typeof Ionicons.glyphMap;
  location: string;
  feelsLike: number;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    icon: string;
    accent: string;
  };
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  condition,
  icon,
  location,
  feelsLike,
  colors,
}) => {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.cardAlt,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name={icon} size={64} color={colors.icon} />
      </View>

      <Text
        style={{
          fontSize: 72,
          fontWeight: "200",
          color: colors.text,
          letterSpacing: -4,
          lineHeight: 80,
        }}
      >
        {temperature}°
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          color: colors.text,
          marginTop: 4,
          textTransform: "capitalize",
        }}
      >
        {condition}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          gap: 6,
        }}
      >
        <Ionicons name="location" size={16} color={colors.textMuted} />
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: "500",
          }}
        >
          {location}
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.cardAlt,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            fontWeight: "500",
          }}
        >
          Feels like {feelsLike}°
        </Text>
      </View>
    </View>
  );
};

export default React.memo(WeatherCard);
