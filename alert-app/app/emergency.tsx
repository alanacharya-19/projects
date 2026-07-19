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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import SOSTouchableOpacity from "@/components/SOSTouchableOpacity";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import { Shadows } from "@/constants/theme";
import type { EmergencyContact } from "@/types";

const EMERGENCY_NUMBERS = [
  { name: "Police", number: "100", icon: "shield-checkmark" as const, color: "#1E40AF", bg: "#EFF6FF" },
  { name: "Fire Dept", number: "101", icon: "flame" as const, color: "#DC2626", bg: "#FEF2F2" },
  { name: "Ambulance", number: "102", icon: "medkit" as const, color: "#16A34A", bg: "#F0FDF4" },
];

const EMERGENCY_MESSAGE_TEMPLATE =
  "EMERGENCY SOS from AlertGuard!\nI need immediate assistance.\nMy current GPS coordinates are: {lat}, {lng}\nPlease send help immediately!";

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const { location } = useLocation();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dark Red Header */}
        <View style={styles.headerArea}>
          <View style={[styles.headerBg, { backgroundColor: "#991B1B" }]}>
            <Text style={styles.headerTitle}>Emergency SOS</Text>
            <Text style={styles.headerSubtitle}>Quick access to emergency services</Text>
          </View>
        </View>

        {/* SOS Button */}
        <View style={[styles.sosCard, { backgroundColor: colors.surface, ...Shadows.lg }]}>
          {sosSent ? (
            <View style={styles.sosSentContainer}>
              <View style={styles.sosSentIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#FFFFFF" />
              </View>
              <Text style={[styles.sosSentTitle, { color: "#DC2626" }]}>SOS Activated!</Text>
              <Text style={[styles.sosSentDesc, { color: colors.textSecondary }]}>
                Emergency services are being contacted
              </Text>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: "#FEE2E2" }]}
                onPress={() => setSosSent(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sosContainer}>
              <SOSTouchableOpacity onPress={handleSOSPress} colors={{ sos: "#DC2626" }} />
              <Text style={[styles.sosHint, { color: colors.textMuted }]}>
                Press and hold for 3 seconds to send SOS
              </Text>
            </View>
          )}
        </View>

        {/* GPS Coordinates */}
        <View style={[styles.gpsCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
          <View style={styles.gpsHeader}>
            <View style={[styles.gpsIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="location" size={18} color="#DC2626" />
            </View>
            <Text style={[styles.gpsTitle, { color: colors.text }]}>Current Location</Text>
          </View>
          {lat !== undefined && lng !== undefined ? (
            <View style={styles.gpsCoords}>
              <View style={[styles.coordChip, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LAT</Text>
                <Text style={[styles.coordValue, { color: colors.text }]}>{lat.toFixed(6)}</Text>
              </View>
              <View style={[styles.coordChip, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LNG</Text>
                <Text style={[styles.coordValue, { color: colors.text }]}>{lng.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.gpsUnavailable, { color: colors.textMuted }]}>
              Location unavailable. Enable location services.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShareLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="share" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Location</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Numbers</Text>
          <View style={styles.numbersRow}>
            {EMERGENCY_NUMBERS.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={[styles.numberCard, { backgroundColor: colors.surface, ...Shadows.sm }]}
                onPress={() => handleCall(item.number)}
                activeOpacity={0.7}
              >
                <View style={[styles.numberIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={[styles.numberName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.numberValue, { color: item.color }]}>{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
            <TouchableOpacity onPress={handleAddContact} activeOpacity={0.7}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.contactsCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
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
                  <View style={[styles.divider, { borderBottomColor: colors.border }]} />
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addContactBtn} onPress={handleAddContact} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addContactText, { color: colors.primary }]}>Add Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerArea: { marginBottom: 20 },
  headerBg: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  sosCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  sosContainer: { alignItems: "center", gap: 16 },
  sosHint: { fontSize: 13, textAlign: "center" },
  sosSentContainer: { alignItems: "center", gap: 12 },
  sosSentIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  sosSentTitle: { fontSize: 22, fontWeight: "800" },
  sosSentDesc: { fontSize: 14, textAlign: "center" },
  cancelBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelText: { color: "#DC2626", fontSize: 16, fontWeight: "700" },
  gpsCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  gpsHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  gpsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTitle: { fontSize: 16, fontWeight: "700" },
  gpsCoords: { flexDirection: "row", gap: 10, marginBottom: 14 },
  coordChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  coordLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  coordValue: { fontSize: 14, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  gpsUnavailable: { fontSize: 13, marginBottom: 14 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  sectionAction: { fontSize: 14, fontWeight: "600" },
  numbersRow: { flexDirection: "row", gap: 10 },
  numberCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  numberIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  numberName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  numberValue: { fontSize: 20, fontWeight: "800" },
  contactsCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  addContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  addContactText: { fontSize: 15, fontWeight: "600" },
});
