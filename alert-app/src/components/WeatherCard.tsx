import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      colors={["#2563EB", "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 28,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              gap: 6,
            }}
          >
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
            <Text
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.85)",
                fontWeight: "500",
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 72,
              fontWeight: "200",
              color: "#FFFFFF",
              letterSpacing: -4,
              lineHeight: 76,
            }}
          >
            {temperature}°
          </Text>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              marginTop: 2,
              textTransform: "capitalize",
            }}
          >
            {condition}
          </Text>
        </View>

        <View
          style={{
            width: 100,
            height: 100,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
          }}
        >
          <Ionicons name={icon} size={80} color="rgba(255,255,255,0.95)" />
        </View>
      </View>

      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.9)",
              fontWeight: "500",
            }}
          >
            Feels like {feelsLike}°
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default React.memo(WeatherCard);
