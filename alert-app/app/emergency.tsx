import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Share,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocation } from "@/hooks/useLocation";
import SOSTouchableOpacity from "@/components/SOSTouchableOpacity";
import type { EmergencyContact } from "@/types";

const { height: SCREEN_H } = Dimensions.get("window");

const EMERGENCY_NUMBERS = [
  { name: "Police", number: "100", icon: "shield-checkmark" as const, gradient: ["#1E40AF", "#1D4ED8"] as const },
  { name: "Fire Dept", number: "101", icon: "flame" as const, gradient: ["#DC2626", "#B91C1C"] as const },
  { name: "Ambulance", number: "102", icon: "medkit" as const, gradient: ["#16A34A", "#15803D"] as const },
];

const EMERGENCY_MESSAGE_TEMPLATE =
  "EMERGENCY SOS from AlertGuard!\nI need immediate assistance.\nMy current GPS coordinates are: {lat}, {lng}\nPlease send help immediately!";

export default function EmergencyScreen() {
  const { location } = useLocation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [contacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phoneNumber: "+91 98765 43210", relationship: "Family", isPrimary: true },
    { id: "2", name: "Dad", phoneNumber: "+91 98765 43211", relationship: "Family", isPrimary: false },
  ]);
  const [sosSent, setSosSent] = useState(false);

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

  const handleBack = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => router.back());
  }, [slideAnim, router]);

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
    <View style={styles.container}>
      <LinearGradient colors={["#DC2626", "#B91C1C", "#991B1B"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_H] }) }] }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
            style={styles.heroGlow}
          />
          <View style={styles.sosIconRing}>
            <View style={styles.sosIconPulse} />
            {sosSent ? (
              <View style={styles.sosSentCircle}>
                <Ionicons name="checkmark-circle" size={52} color="#FFFFFF" />
              </View>
            ) : (
              <SOSTouchableOpacity onPress={handleSOSPress} colors={{ sos: "#FFFFFF" }} />
            )}
          </View>
          {sosSent && (
            <TouchableOpacity
              style={styles.cancelSosBtn}
              onPress={() => setSosSent(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelSosText}>Cancel SOS</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.heroTitle}>Emergency SOS</Text>
          <Text style={styles.heroSubtitle}>Press & hold the button above for 3s to alert</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="call" size={16} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>Quick Dial</Text>
        </View>
        <View style={styles.quickDialRow}>
          {EMERGENCY_NUMBERS.map((item) => (
            <TouchableOpacity
              key={item.number}
              style={styles.quickDialCard}
              onPress={() => handleCall(item.number)}
              activeOpacity={0.7}
            >
              <LinearGradient colors={item.gradient} style={styles.quickDialGradient}>
                <Ionicons name={item.icon} size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickDialName}>{item.name}</Text>
              <Text style={styles.quickDialNumber}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={16} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>Your Location</Text>
        </View>
        <View style={styles.locationCard}>
          {lat !== undefined && lng !== undefined ? (
            <View style={styles.coordRow}>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LAT</Text>
                <Text style={styles.coordValue}>{lat.toFixed(6)}</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LNG</Text>
                <Text style={styles.coordValue}>{lng.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.coordUnavailable}>Location unavailable. Enable GPS.</Text>
          )}
          <TouchableOpacity style={styles.shareLocationBtn} onPress={handleShareLocation} activeOpacity={0.7}>
            <Ionicons name="share-social" size={18} color="#DC2626" />
            <Text style={styles.shareLocationText}>Share Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={16} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={handleAddContact} activeOpacity={0.7}>
            <Text style={styles.addContactText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactsCard}>
          {contacts.map((contact, idx) => (
            <View key={contact.id}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => handleCall(contact.phoneNumber)}
                activeOpacity={0.7}
              >
                <View style={[styles.contactAvatar, { backgroundColor: contact.isPrimary ? "#DC2626" : "#F1F5F9" }]}>
                  <Text style={[styles.contactAvatarText, { color: contact.isPrimary ? "#FFFFFF" : "#64748B" }]}>
                    {contact.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <View style={styles.contactBadge}>
                  <Text style={styles.contactBadgeText}>{contact.relationship}</Text>
                </View>
                <Ionicons name="call-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
              {idx < contacts.length - 1 && <View style={styles.contactDivider} />}
            </View>
          ))}
          <TouchableOpacity style={styles.addContactRow} onPress={handleAddContact} activeOpacity={0.7}>
            <Ionicons name="add-circle" size={22} color="#DC2626" />
            <Text style={styles.addContactLabel}>Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 16,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 24,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    height: 200,
    borderRadius: 100,
  },
  sosIconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sosIconPulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sosSentCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cancelSosBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 8,
  },
  cancelSosText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  quickDialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickDialCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  quickDialGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickDialName: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  quickDialNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  locationCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 24,
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  coordBox: {
    flex: 1,
    alignItems: "center",
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "monospace",
  },
  coordDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 12,
  },
  coordUnavailable: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 14,
  },
  shareLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  shareLocationText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },
  contactsCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contactPhone: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 1,
  },
  contactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  contactBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 72,
  },
  addContactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  addContactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
});
