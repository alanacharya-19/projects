import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmergencyContactCardProps {
  name: string;
  phone: string;
  onCall: (phone: string) => void;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
  };
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  name,
  phone,
  onCall,
  colors,
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.cardAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.accent,
          }}
        >
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            fontWeight: "500",
          }}
        >
          {phone}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onCall(phone)}
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="call" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(EmergencyContactCard);
