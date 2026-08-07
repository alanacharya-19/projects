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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import ChatBubble from "@/components/ChatBubble";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows } from "@/constants/theme";
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
  kit: "Essential emergency kit items:\n\n💧 Water: 4L per person per day (3-day supply)\n🍞 Non-perishable food (3-day supply)\n🔦 Flashlight + extra batteries\n🩹 First aid kit\n📻 Battery-powered radio\n📱 Phone charger (power bank)\n📄 Important documents (waterproof bag)\n💊 Medications (7-day supply)\n\nKeep your kit near an exit and check it every 6 months.",
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
  const { colors, resolvedMode } = useTheme();
  const router = useRouter();
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

  const isDark = resolvedMode === "dark";

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
    card: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)",
    cardAlt: isDark ? "rgba(31,41,55,0.6)" : "rgba(255,255,255,0.6)",
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    accent: colors.primary,
    userBubble: colors.primary,
    aiBubble: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)",
  };

  return (
    <GradientBackground colors={isDark ? Gradients.homeDark : Gradients.home}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <LinearGradient
          colors={isDark ? (["#0D1F33", "#10213B"] as const) : (["#F0F5FF", "#F7F9FC"] as const)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.headerBackBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)" }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
            <LinearGradient
              colors={isDark ? Gradients.primaryDark : Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Assistant</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.headerStatus, { color: colors.success }]}>Online</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <ChatBubble
              message={item.content}
              isUser={item.role === "user"}
              timestamp={formatDate(item.timestamp, "time")}
              colors={chatColors}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <View style={[styles.typingBubble, { backgroundColor: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)", ...Shadows.sm }]}>
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

        {messages.length <= 2 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsLabel, { color: colors.textMuted }]}>Quick Questions</Text>
            <View style={styles.suggestionsGrid}>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.suggestionChip, { backgroundColor: isDark ? "rgba(31,41,55,0.85)" : "#FFFFFF", borderColor: isDark ? "rgba(255,255,255,0.08)" : colors.primary + "20", ...Shadows.md }]}
                  onPress={() => handleSuggestion(suggestion)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.suggestionAccent, { backgroundColor: colors.primary }]} />
                  <Ionicons name="help-circle-outline" size={14} color={colors.primary} style={{ marginRight: 2 }} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <LinearGradient
          colors={isDark ? (["rgba(16,33,59,0.95)", "rgba(8,20,38,0.95)"] as const) : (["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"] as const)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.inputBar}
        >
          <View style={[styles.inputField, { backgroundColor: isDark ? "rgba(31,41,55,0.6)" : "#F1F5F9", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0" }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSend} activeOpacity={0.7}>
              <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={[styles.sendBtn, { backgroundColor: colors.surfaceVariant, opacity: 0.5 }]}>
              <Ionicons name="send" size={18} color={colors.textMuted} />
            </View>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerStatus: { fontSize: 12, fontWeight: "500" },
  messagesList: { paddingVertical: 16, paddingHorizontal: 20, flexGrow: 1 },
  typingContainer: { paddingVertical: 8 },
  typingBubble: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderBottomLeftRadius: 8, alignSelf: "flex-start" },
  typingDots: { flexDirection: "row", gap: 4, alignItems: "center", height: 16 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  suggestionsContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  suggestionsLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" },
  suggestionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, overflow: "hidden", position: "relative" },
  suggestionAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  suggestionText: { fontSize: 12, fontWeight: "500" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 10,
  },
  inputField: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textInput: { fontSize: 15, fontWeight: "500", maxHeight: 100, paddingVertical: 0 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
});
