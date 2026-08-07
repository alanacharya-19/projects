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
        borderRadius: 20,
        padding: 20,
        flexDirection: "row",
        gap: 16,
        alignItems: "flex-start",
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
          backgroundColor: colors.accent + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: colors.accent,
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
            letterSpacing: -0.2,
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
