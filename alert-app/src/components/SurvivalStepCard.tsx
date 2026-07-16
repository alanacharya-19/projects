import React from "react";
import { View, Text } from "react-native";

interface SurvivalStepCardProps {
  step: number;
  title: string;
  description: string;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
}

const SurvivalStepCard: React.FC<SurvivalStepCardProps> = ({
  step,
  title,
  description,
  colors,
}) => {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#FFFFFF",
          }}
        >
          {step}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 21,
            color: colors.textSecondary,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(SurvivalStepCard);
