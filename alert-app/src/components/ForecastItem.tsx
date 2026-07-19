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
  const textColor = isNow ? "#FFFFFF" : colors.text;
  const subColor = isNow ? "rgba(255,255,255,0.8)" : colors.textMuted;

  return (
    <View
      style={{
        width: 72,
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 24,
        backgroundColor: isNow ? colors.accent : colors.card,
        gap: 8,
        shadowColor: isNow ? colors.accent : "#000",
        shadowOffset: { width: 0, height: isNow ? 4 : 1 },
        shadowOpacity: isNow ? 0.3 : 0.04,
        shadowRadius: isNow ? 12 : 4,
        elevation: isNow ? 6 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: isNow ? "700" : "500",
          color: subColor,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {time}
      </Text>

      <Ionicons
        name={icon}
        size={28}
        color={textColor}
      />

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: textColor,
          letterSpacing: -0.3,
        }}
      >
        {temp}°
      </Text>

      {rainChance !== undefined && rainChance > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: isNow ? "rgba(255,255,255,0.2)" : colors.accent + "12",
          }}
        >
          <Ionicons
            name="water"
            size={10}
            color={subColor}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: subColor,
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
