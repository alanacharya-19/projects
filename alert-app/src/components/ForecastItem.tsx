import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ForecastItemProps {
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  temp: number;
  rainChance?: number;
  isNow?: boolean;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    activeCard: string;
  };
}

const ForecastItem: React.FC<ForecastItemProps> = ({
  time,
  icon,
  temp,
  rainChance,
  isNow = false,
  colors,
}) => {
  return (
    <View
      style={{
        width: 72,
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 20,
        backgroundColor: isNow ? colors.accent : colors.card,
        gap: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: isNow ? "700" : "500",
          color: isNow ? "#FFFFFF" : colors.textSecondary,
        }}
      >
        {time}
      </Text>

      <Ionicons
        name={icon}
        size={26}
        color={isNow ? "#FFFFFF" : colors.text}
      />

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: isNow ? "#FFFFFF" : colors.text,
        }}
      >
        {temp}°
      </Text>

      {rainChance !== undefined && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Ionicons
            name="water"
            size={11}
            color={isNow ? "rgba(255,255,255,0.8)" : colors.accent}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: isNow ? "rgba(255,255,255,0.8)" : colors.textMuted,
            }}
          >
            {rainChance}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(ForecastItem);
