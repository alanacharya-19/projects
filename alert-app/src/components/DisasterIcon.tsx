import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DisasterType =
  | "earthquake"
  | "flood"
  | "wildfire"
  | "storm"
  | "tornado"
  | "tsunami"
  | "heatwave"
  | "coldwave"
  | "landslide"
  | "volcano";

interface DisasterConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const DISASTER_CONFIG: Record<DisasterType, DisasterConfig> = {
  earthquake: { icon: "earth", color: "#92400E" },
  flood: { icon: "water", color: "#1D4ED8" },
  wildfire: { icon: "flame", color: "#DC2626" },
  storm: { icon: "thunderstorm", color: "#7C3AED" },
  tornado: { icon: "funnel", color: "#6B21A8" },
  tsunami: { icon: "alert-circle", color: "#0369A1" },
  heatwave: { icon: "sunny", color: "#EA580C" },
  coldwave: { icon: "snow", color: "#0EA5E9" },
  landslide: { icon: "triangle", color: "#78350F" },
  volcano: { icon: "flash", color: "#B91C1C" },
};

interface DisasterIconProps {
  type: string;
  size?: number;
  colors?: {
    icon: string;
  };
}

const DisasterIcon: React.FC<DisasterIconProps> = ({
  type,
  size = 28,
  colors,
}) => {
  const config = DISASTER_CONFIG[type as DisasterType] || {
    icon: "warning",
    color: "#6B7280",
  };

  const iconColor = colors?.icon || config.color;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={config.icon} size={size} color={iconColor} />
    </View>
  );
};

export type { DisasterType };
export default React.memo(DisasterIcon);
