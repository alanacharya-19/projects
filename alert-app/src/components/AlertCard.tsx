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
  extreme: { color: "#DC2626", key: "severityExtreme" },
  severe: { color: "#EA580C", key: "severitySevere" },
  moderate: { color: "#CA8A04", key: "severityModerate" },
  minor: { color: "#2563EB", key: "severityMinor" },
};

const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress, colors }) => {
  const stripeColor = SEVERITY_MAP[alert.severity]?.color || colors.severityModerate;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(alert)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View
        style={{
          width: 5,
          backgroundColor: stripeColor,
        }}
      />

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          gap: 14,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.cardAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DisasterIcon
            type={alert.type}
            size={26}
            colors={colors}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {alert.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 6,
            }}
            numberOfLines={2}
          >
            {alert.description}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text
                style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}
              >
                {alert.timeAgo}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
              <Text
                style={{ fontSize: 12, color: colors.textMuted, fontWeight: "500" }}
              >
                {alert.distance}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(AlertCard);
