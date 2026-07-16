import React from "react";
import { View, Text } from "react-native";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    userBubble: string;
    aiBubble: string;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  colors,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 20,
          borderBottomRightRadius: isUser ? 6 : 20,
          borderBottomLeftRadius: isUser ? 20 : 6,
          backgroundColor: isUser
            ? colors.userBubble || colors.accent
            : colors.aiBubble || colors.cardAlt,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: isUser ? "#FFFFFF" : colors.text,
          }}
        >
          {message}
        </Text>

        {timestamp && (
          <Text
            style={{
              fontSize: 11,
              color: isUser
                ? "rgba(255,255,255,0.65)"
                : colors.textMuted,
              marginTop: 6,
              alignSelf: isUser ? "flex-end" : "flex-start",
            }}
          >
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
};

export default React.memo(ChatBubble);
