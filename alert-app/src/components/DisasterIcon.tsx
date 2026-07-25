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
  earthquake: { icon: "earth", color: "#FF3B30" },
  flood: { icon: "water", color: "#2EA8FF" },
  wildfire: { icon: "flame", color: "#FF9800" },
  storm: { icon: "thunderstorm", color: "#B000FF" },
  tornado: { icon: "funnel", color: "#FF6B9D" },
  tsunami: { icon: "alert-circle", color: "#0052CC" },
  heatwave: { icon: "sunny", color: "#E65100" },
  coldwave: { icon: "snow", color: "#00D4FF" },
  landslide: { icon: "triangle", color: "#8D6E63" },
  volcano: { icon: "flash", color: "#FF3B30" },
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
