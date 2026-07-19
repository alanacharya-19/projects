import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  colors: {
    text: string;
    textMuted: string;
    accent: string;
  };
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  colors,
}) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />

      {message && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            fontWeight: "500",
            letterSpacing: 0.2,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default React.memo(LoadingSpinner);
