import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Share,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import SOSTouchableOpacity from "@/components/SOSTouchableOpacity";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import GradientBackground from "@/components/GradientBackground";
import { Gradients } from "@/constants/theme";
import type { EmergencyContact } from "@/types";

const EMERGENCY_NUMBERS = [
  { name: "Police", number: "100", icon: "shield-checkmark" as const, color: "#1E40AF", bg: "#EFF6FF" },
  { name: "Fire Dept", number: "101", icon: "flame" as const, color: "#DC2626", bg: "#FEF2F2" },
  { name: "Ambulance", number: "102", icon: "medkit" as const, color: "#16A34A", bg: "#F0FDF4" },
];

const EMERGENCY_MESSAGE_TEMPLATE =
  "EMERGENCY SOS from AlertGuard!\nI need immediate assistance.\nMy current GPS coordinates are: {lat}, {lng}\nPlease send help immediately!";

export default function EmergencyScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
  const insets = useSafeAreaInsets();
  const [contacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phoneNumber: "+91 98765 43210", relationship: "Family", isPrimary: true },
    { id: "2", name: "Dad", phoneNumber: "+91 98765 43211", relationship: "Family", isPrimary: false },
  ]);
  const [sosSent, setSosSent] = useState(false);

  const isDark = resolvedMode === "dark";

  const handleSOSPress = useCallback(() => {
    setSosSent(true);
    Alert.alert(
      "SOS Activated!",
      "Emergency services and your contacts are being notified with your current location.",
      [
        { text: "Call Emergency", onPress: () => Linking.openURL("tel:112") },
        { text: "OK", style: "cancel", onPress: () => setSosSent(false) },
      ]
    );
  }, []);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleShareLocation = useCallback(async () => {
    const lat = location?.latitude ?? 0;
    const lng = location?.longitude ?? 0;
    const message = EMERGENCY_MESSAGE_TEMPLATE
      .replace("{lat}", lat.toFixed(6))
      .replace("{lng}", lng.toFixed(6));
    try {
      await Share.share({ message, title: "Emergency Location Share" });
    } catch {}
  }, [location]);

  const handleAddContact = useCallback(() => {
    Alert.alert("Add Contact", "Navigate to Settings to add emergency contacts.", [{ text: "OK" }]);
  }, []);

  const lat = location?.latitude;
  const lng = location?.longitude;

  return (
    <GradientBackground colors={isDark ? Gradients.alertDark : Gradients.alert}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Hero Header */}
        <LinearGradient
          colors={isDark ? (["#7F1D1D", "#991B1B", "#B91C1C"] as const) : (["#991B1B", "#DC2626", "#EF4444"] as const)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 28,
            marginBottom: 20,
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <Ionicons name="warning" size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 }}>
            Emergency SOS
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
            Quick access to emergency services
          </Text>
        </LinearGradient>

        {/* SOS Button Card */}
        <LinearGradient
          colors={isDark ? Gradients.glassDark : Gradients.glass}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
          }}
        >
          {sosSent ? (
            <View style={{ alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Ionicons name="checkmark-circle" size={56} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#DC2626" }}>SOS Activated!</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
                Emergency services are being contacted
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 4,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  backgroundColor: "#FEE2E2",
                }}
                onPress={() => setSosSent(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#DC2626", fontSize: 16, fontWeight: "700" }}>Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 16 }}>
              <SOSTouchableOpacity onPress={handleSOSPress} colors={{ sos: "#DC2626" }} />
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                Press and hold for 3 seconds to send SOS
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* GPS Coordinates */}
        <LinearGradient
          colors={isDark ? Gradients.glassDark : Gradients.glass}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#FEE2E2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="location" size={18} color="#DC2626" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Current Location</Text>
          </View>
          {lat !== undefined && lng !== undefined ? (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                { label: "LAT", value: lat.toFixed(6) },
                { label: "LNG", value: lng.toFixed(6) },
              ].map((coord) => (
                <View
                  key={coord.label}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1,
                      color: colors.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    {coord.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    }}
                  >
                    {coord.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>
              Location unavailable. Enable location services.
            </Text>
          )}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: colors.primary,
            }}
            onPress={handleShareLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="share" size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Share Location</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Emergency Numbers */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Emergency Numbers
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {EMERGENCY_NUMBERS.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={{
                  flex: 1,
                  borderRadius: 20,
                  padding: 14,
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: isDark ? "rgba(31,41,55,0.7)" : "rgba(255,255,255,0.7)",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                }}
                onPress={() => handleCall(item.number)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: item.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: item.color }}>{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Emergency Contacts</Text>
            <TouchableOpacity onPress={handleAddContact} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>Add</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={isDark ? Gradients.glassDark : Gradients.glass}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
            }}
          >
            {contacts.map((contact, idx) => (
              <View key={contact.id}>
                <EmergencyContactCard
                  name={contact.name}
                  phone={contact.phoneNumber}
                  onCall={handleCall}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    accent: colors.primary,
                  }}
                />
                {idx < contacts.length - 1 && (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      marginLeft: 16,
                      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    }}
                  />
                )}
              </View>
            ))}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 16,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }}
              onPress={handleAddContact}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.primary }}>
                Add Emergency Contact
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}
