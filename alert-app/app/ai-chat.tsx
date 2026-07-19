import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import ChatBubble from "@/components/ChatBubble";
import { generateId, formatDate } from "@/utils/helpers";
import type { ChatMessage } from "@/types";

const QUICK_SUGGESTIONS = [
  "Is it safe to travel tomorrow?",
  "Will it rain today?",
  "What should I do during an earthquake?",
  "Current weather conditions?",
  "Any active disasters nearby?",
  "How to prepare an emergency kit?",
];

const AI_RESPONSES: Record<string, string> = {
  travel: "Based on current weather data, conditions look mostly clear for tomorrow with a slight chance of rain in the afternoon. Temperature will be around 28°C with moderate winds. Overall, it should be safe to travel, but carry an umbrella just in case. Check local alerts before heading out.",
  rain: "Current forecast shows a 35% chance of rain this afternoon with expected rainfall of 2-5mm. The rain is likely to be light and intermittent. Temperatures will remain around 30°C. Keep an eye on the weather radar for any sudden changes.",
  earthquake: "During an earthquake, remember: DROP, COVER, and HOLD ON. Get under a sturdy table or desk, protect your head and neck, and hold on until the shaking stops. Do NOT run outside during the quake. If outdoors, move to an open area away from buildings. After the shaking stops, be prepared for aftershocks.",
  weather: "Current conditions: 31°C, partly cloudy, humidity 65%, wind 12 km/h from the southwest. Air quality index is moderate (AQI: 85). UV index is high (7) - use sunscreen if going outside. Sunset is at 6:45 PM.",
  disaster: "Currently there are 2 active alerts in your area:\n\n1. Heat Advisory (Moderate) - Expected temperatures above 40°C today and tomorrow\n2. Air Quality Warning (Minor) - AQI elevated due to dust particles\n\nNo severe weather or disaster warnings at this time. Stay safe!",
  kit: "Essential emergency kit items:\n\n🎒 Water: 4L per person per day (3-day supply)\n🍞 Non-perishable food (3-day supply)\n🔦 Flashlight + extra batteries\n🩹 First aid kit\n📻 Battery-powered radio\n📱 Phone charger (power bank)\n📄 Important documents (waterproof bag)\n💊 Medications (7-day supply)\n\nKeep your kit near an exit and check it every 6 months.",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("travel") || lower.includes("safe to go")) return AI_RESPONSES.travel;
  if (lower.includes("rain") || lower.includes("precipitation")) return AI_RESPONSES.rain;
  if (lower.includes("earthquake") || lower.includes("tremor") || lower.includes("quake")) return AI_RESPONSES.earthquake;
  if (lower.includes("weather") || lower.includes("temperature") || lower.includes("condition")) return AI_RESPONSES.weather;
  if (lower.includes("disaster") || lower.includes("alert") || lower.includes("warning") || lower.includes("nearby")) return AI_RESPONSES.disaster;
  if (lower.includes("kit") || lower.includes("prepare") || lower.includes("supply") || lower.includes("supplies")) return AI_RESPONSES.kit;
  return "I can help you with weather information, disaster preparedness, and safety advice. Try asking me about current weather conditions, travel safety, earthquake preparedness, or emergency kits. How can I assist you today?";
}

export default function AIChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AlertGuard AI assistant. I can help you with weather information, disaster preparedness, and safety guidance. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMessage: ChatMessage = { id: generateId(), role: "user", content: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    setTimeout(() => {
      const aiMessage: ChatMessage = { id: generateId(), role: "assistant", content: getAIResponse(text), timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }, []);

  const handleSend = useCallback(() => sendMessage(inputText), [inputText, sendMessage]);
  const handleSuggestion = useCallback((suggestion: string) => sendMessage(suggestion), [sendMessage]);

  const chatColors = {
    card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary,
    textMuted: colors.textMuted, accent: colors.primary, userBubble: colors.primary, aiBubble: colors.surfaceVariant,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="default" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>AI Assistant</Text>
            <Text style={[styles.headerStatus, { color: colors.success }]}>Online</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <ChatBubble message={item.content} isUser={item.role === "user"} timestamp={formatDate(item.timestamp, "time")} colors={chatColors} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <View style={[styles.typingBubble, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: 0.4 }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: 0.8 }]} />
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: colors.textMuted }]}>Quick Questions</Text>
          <View style={styles.suggestionsGrid}>
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.suggestionChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                onPress={() => handleSuggestion(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { color: colors.text, backgroundColor: colors.surfaceVariant }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceVariant }]}
          onPress={handleSend}
          activeOpacity={0.7}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? "#FFFFFF" : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerStatus: { fontSize: 13, fontWeight: "500" },
  messagesList: { paddingVertical: 16, flexGrow: 1 },
  typingContainer: { paddingHorizontal: 20, paddingVertical: 8 },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomLeftRadius: 6, alignSelf: "flex-start", maxWidth: "30%" },
  typingDots: { flexDirection: "row", gap: 4, alignItems: "center", height: 16 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  suggestionsContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  suggestionsTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  suggestionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  suggestionText: { fontSize: 13, fontWeight: "500" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
