import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface SectionHeaderProps {
  title: string;
  onAction?: () => void;
  actionText?: string;
  colors: {
    text: string;
    accent: string;
    textMuted: string;
  };
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onAction,
  actionText = "See All",
  colors,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
        marginTop: 24,
        marginBottom: 14,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>

      {onAction && (
        <TouchableOpacity activeOpacity={0.6} onPress={onAction}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(SectionHeader);
