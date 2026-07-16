import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  colors,
}) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.cardAlt,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          marginBottom: actionText ? 28 : 0,
        }}
      >
        {description}
      </Text>

      {actionText && onAction && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAction}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(EmptyState);
