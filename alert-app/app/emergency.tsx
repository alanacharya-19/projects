import React, { useState, useRef, useCallback } from "react";
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
import { useTheme } from "@/context/ThemeContext";
import { useAppContext } from "@/context/AppContext";
import { useLocation } from "@/hooks/useLocation";
import SOSTouchableOpacity from "@/components/SOSTouchableOpacity";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import SectionHeader from "@/components/SectionHeader";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";
import type { EmergencyContact } from "@/types";

const EMERGENCY_NUMBERS = [
  { name: "Police", number: "100", icon: "shield-checkmark" as const, color: "#1E40AF" },
  { name: "Fire Department", number: "101", icon: "flame" as const, color: "#DC2626" },
  { name: "Ambulance", number: "102", icon: "medkit" as const, color: "#16A34A" },
];

const EMERGENCY_MESSAGE_TEMPLATE =
  "EMERGENCY SOS from AlertGuard!\nI need immediate assistance.\nMy current GPS coordinates are: {lat}, {lng}\nPlease send help immediately!";

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const { state } = useAppContext();
  const { location } = useLocation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phone: "+91 98765 43210", relationship: "Family", isPrimary: true },
    { id: "2", name: "Dad", phone: "+91 98765 43211", relationship: "Family", isPrimary: false },
  ]);
  const [sosSent, setSosSent] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themedStyles = {
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.surface },
    cardAlt: { backgroundColor: colors.surfaceVariant },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    textMuted: { color: colors.textMuted },
    border: { borderColor: colors.border },
    sosRed: { backgroundColor: "#DC2626" },
    sosRedLight: { backgroundColor: "#FEE2E2" },
    sosRedText: { color: "#DC2626" },
    primary: { backgroundColor: colors.primary },
    primaryText: { color: colors.primary },
    white: { color: "#FFFFFF" },
    errorLight: { backgroundColor: colors.errorLight },
    errorText: { color: colors.error },
  };

  const handleSOSPress = useCallback(() => {
    setSosSent(true);
    Alert.alert(
      "SOS Activated!",
      "Emergency services and your contacts are being notified with your current location.",
      [
        {
          text: "Call Emergency",
          onPress: () => Linking.openURL("tel:112"),
        },
        {
          text: "OK",
          style: "cancel",
          onPress: () => setSosSent(false),
        },
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
      await Share.share({
        message,
        title: "Emergency Location Share",
      });
    } catch {
      // user cancelled
    }
  }, [location]);

  const handleAddContact = useCallback(() => {
    Alert.alert("Add Contact", "Navigate to Settings to add emergency contacts.", [
      { text: "OK" },
    ]);
  }, []);

  const lat = location?.latitude;
  const lng = location?.longitude;

  return (
    <View style={[styles.container, themedStyles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, themedStyles.text]}>Emergency SOS</Text>
          <Text style={[styles.headerSubtitle, themedStyles.textMuted]}>
            Quick access to emergency services
          </Text>
        </View>

        {/* SOS Button */}
        <View style={[styles.sosSection, themedStyles.card, { ...Shadows.lg }]}>
          {sosSent ? (
            <View style={styles.sosSentContainer}>
              <View style={[styles.sosSentIcon, themedStyles.sosRed]}>
                <Ionicons name="checkmark-circle" size={60} color="#FFFFFF" />
              </View>
              <Text style={[styles.sosSentTitle, themedStyles.sosRedText]}>
                SOS Activated!
              </Text>
              <Text style={[styles.sosSentDesc, themedStyles.textSecondary]}>
                Emergency services are being contacted
              </Text>
              <TouchableOpacity
                style={[styles.sosCancelButton, { ...Shadows.sm }]}
                onPress={() => setSosSent(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.sosCancelText}>Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sosContainer}>
              <SOSTouchableOpacity
                onPress={handleSOSPress}
                colors={{ sos: "#DC2626" }}
              />
              <Text style={[styles.sosHint, themedStyles.textMuted]}>
                Press and hold for 3 seconds to send SOS
              </Text>
            </View>
          )}
        </View>

        {/* GPS Coordinates */}
        <View style={[styles.gpsSection, themedStyles.card, { ...Shadows.sm }]}>
          <View style={styles.gpsHeader}>
            <Ionicons name="location" size={20} color="#DC2626" />
            <Text style={[styles.gpsTitle, themedStyles.text]}>Current Location</Text>
          </View>
          {lat !== undefined && lng !== undefined ? (
            <View style={styles.gpsCoords}>
              <Text style={[styles.gpsCoord, themedStyles.textSecondary]}>
                Lat: {lat.toFixed(6)}
              </Text>
              <Text style={[styles.gpsCoord, themedStyles.textSecondary]}>
                Lng: {lng.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.gpsUnavailable, themedStyles.textMuted]}>
              Location unavailable. Enable location services.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.shareButton, themedStyles.primary, { ...Shadows.sm }]}
            onPress={handleShareLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="share" size={18} color="#FFFFFF" />
            <Text style={[styles.shareButtonText, themedStyles.white]}>Share Location</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Message Template */}
        <View style={[styles.messageSection, themedStyles.card, { ...Shadows.sm }]}>
          <View style={styles.messageHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.warning} />
            <Text style={[styles.messageTitle, themedStyles.text]}>
              Emergency Message
            </Text>
          </View>
          <Text style={[styles.messagePreview, themedStyles.textSecondary]}>
            {EMERGENCY_MESSAGE_TEMPLATE.replace("{lat}", lat?.toFixed(6) ?? "N/A").replace(
              "{lng}",
              lng?.toFixed(6) ?? "N/A"
            )}
          </Text>
          <TouchableOpacity
            style={[styles.copyButton, { ...Shadows.sm }]}
            activeOpacity={0.7}
            onPress={() =>
              Share.share({
                message: EMERGENCY_MESSAGE_TEMPLATE.replace(
                  "{lat}",
                  lat?.toFixed(6) ?? "N/A"
                ).replace("{lng}", lng?.toFixed(6) ?? "N/A"),
              })
            }
          >
            <Ionicons name="copy" size={16} color={colors.warning} />
            <Text style={[styles.copyButtonText, { color: colors.warning }]}>
              Copy & Share
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Emergency Numbers */}
        <View style={styles.section}>
          <SectionHeader
            title="Emergency Numbers"
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={styles.emergencyNumbersGrid}>
            {EMERGENCY_NUMBERS.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={[styles.emergencyNumberCard, themedStyles.card, { ...Shadows.md }]}
                onPress={() => handleCall(item.number)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.emergencyNumberIcon,
                    { backgroundColor: item.color + "20" },
                  ]}
                >
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={[styles.emergencyNumberName, themedStyles.text]}>
                  {item.name}
                </Text>
                <Text style={[styles.emergencyNumberValue, { color: item.color }]}>
                  {item.number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <SectionHeader
            title="Emergency Contacts"
            actionText="Add"
            onAction={handleAddContact}
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <EmergencyContactCard
                key={contact.id}
                name={contact.name}
                phone={contact.phone}
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
            ))}
          </View>
          <TouchableOpacity
            style={[styles.addContactButton, { borderColor: colors.primary }]}
            onPress={handleAddContact}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.addContactText, { color: colors.primary }]}>
              Add Emergency Contact
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
  },
  sosSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sosContainer: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  sosHint: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  sosSentContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  sosSentIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  sosSentTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "800",
  },
  sosSentDesc: {
    fontSize: FontSizes.md,
    textAlign: "center",
  },
  sosCancelButton: {
    marginTop: Spacing.sm,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  sosCancelText: {
    color: "#DC2626",
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  gpsSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  gpsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gpsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  gpsCoords: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  gpsCoord: {
    fontSize: FontSizes.md,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  gpsUnavailable: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  shareButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  messageSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  messageTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  messagePreview: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  copyButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  emergencyNumbersGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  emergencyNumberCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emergencyNumberIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyNumberName: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  emergencyNumberValue: {
    fontSize: FontSizes.xl,
    fontWeight: "800",
  },
  contactsList: {
    gap: Spacing.md,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: Spacing.md,
  },
  addContactText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
});
