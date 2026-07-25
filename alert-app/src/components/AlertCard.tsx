import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DisasterIcon from "./DisasterIcon";

export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";

export interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: string;
  timeAgo: string;
  distance: string;
}

interface AlertCardProps {
  alert: AlertData;
  onPress: (alert: AlertData) => void;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    severityExtreme: string;
    severitySevere: string;
    severityModerate: string;
    severityMinor: string;
    divider: string;
  };
}

const SEVERITY_MAP: Record<AlertSeverity, { color: string }> = {
  extreme: { color: "#DC2626" },
  severe: { color: "#EA580C" },
  moderate: { color: "#CA8A04" },
  minor: { color: "#2563EB" },
};

const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress, colors }) => {
  const stripeColor = SEVERITY_MAP[alert.severity]?.color || colors.severityModerate;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(alert)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View
        style={{
          width: 4,
          backgroundColor: stripeColor,
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
        }}
      />

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          padding: 18,
          gap: 14,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: stripeColor + "12",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DisasterIcon
            type={alert.type}
            size={26}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {alert.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 8,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {alert.description}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text
                style={{ fontSize: 11, color: colors.textMuted, fontWeight: "500" }}
              >
                {alert.timeAgo}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
              <Text
                style={{ fontSize: 11, color: colors.textMuted, fontWeight: "500" }}
              >
                {alert.distance}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(AlertCard);
