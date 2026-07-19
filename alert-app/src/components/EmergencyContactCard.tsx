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
        borderRadius: 20,
        padding: 18,
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
          backgroundColor: colors.accent + "15",
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
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            fontWeight: "400",
          }}
        >
          {phone}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onCall(phone)}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Ionicons name="call" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(EmergencyContactCard);
