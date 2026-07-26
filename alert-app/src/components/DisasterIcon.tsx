import React from "react";
import { View, Image, ImageStyle } from "react-native";
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

const CUSTOM_ICON_MAP: Record<string, ReturnType<typeof require>> = {
  earthquake: require("../../assets/icons/earthquake.png"),
  flood: require("../../assets/icons/flood.png"),
  wildfire: require("../../assets/icons/wildfire.png"),
  storm: require("../../assets/icons/storms.png"),
  tornado: require("../../assets/icons/storms.png"),
  heatwave: require("../../assets/icons/heatwaves.png"),
};

const FALLBACK_IONICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  tsunami: "alert-circle",
  coldwave: "snow",
  landslide: "triangle",
  volcano: "flash",
};

const FALLBACK_COLOR: Record<string, string> = {
  tsunami: "#0052CC",
  coldwave: "#00D4FF",
  landslide: "#8D6E63",
  volcano: "#FF3B30",
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
  const customIcon = CUSTOM_ICON_MAP[type];

  if (customIcon) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Image
          source={customIcon}
          style={{ width: size, height: size, resizeMode: "contain" } as ImageStyle}
        />
      </View>
    );
  }

  const iconName = FALLBACK_IONICON[type] || "warning";
  const iconColor = colors?.icon || FALLBACK_COLOR[type] || "#6B7280";

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={iconName} size={size} color={iconColor} />
    </View>
  );
};

export type { DisasterType };
export default React.memo(DisasterIcon);
