import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useAppContext } from "@/context/AppContext";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";
import { APP_CONFIG } from "@/constants/config";
import type { ThemeMode, EmergencyContact, SavedLocation } from "@/types";
import { AlertSeverity } from "@/types";

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "light", label: "Light", icon: "sunny" },
  { key: "dark", label: "Dark", icon: "moon" },
  { key: "auto", label: "Auto", icon: "phone-portrait" },
];

const TEMP_UNITS = [
  { key: "celsius" as const, label: "°C" },
  { key: "fahrenheit" as const, label: "°F" },
];

const WIND_UNITS = [
  { key: "kmh" as const, label: "km/h" },
  { key: "mph" as const, label: "mph" },
];

const SEVERITY_OPTIONS = [
  { key: AlertSeverity.MINOR, label: "Minor" },
  { key: AlertSeverity.MODERATE, label: "Moderate" },
  { key: AlertSeverity.SEVERE, label: "Severe" },
  { key: AlertSeverity.EXTREME, label: "Extreme" },
  { key: AlertSeverity.EMERGENCY, label: "Emergency" },
];

export default function SettingsScreen() {
  const { colors, mode, setTheme } = useTheme();
  const { state, updateSettings, updateNotificationPrefs } = useAppContext();
  const { settings } = state;

  const [contacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phone: "+91 98765 43210", relationship: "Family", isPrimary: true },
    { id: "2", name: "Dad", phone: "+91 98765 43211", relationship: "Family", isPrimary: false },
  ]);

  const [savedLocations] = useState<SavedLocation[]>([
    {
      id: "1",
      name: "Home",
      address: "123 Main Street, New Delhi",
      coordinates: { latitude: 28.6139, longitude: 77.209 },
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: "2",
      name: "Office",
      address: "456 Business Park, Gurgaon",
      coordinates: { latitude: 28.4595, longitude: 77.0266 },
      isDefault: false,
      createdAt: Date.now(),
    },
  ]);

  const toggleNotification = useCallback(
    (key: keyof typeof settings.notificationPrefs) => {
      updateNotificationPrefs({
        [key]: !(settings.notificationPrefs as any)[key],
      });
    },
    [settings.notificationPrefs, updateNotificationPrefs]
  );

  const themedStyles = {
    sectionCard: { backgroundColor: colors.surface },
    sectionTitle: { color: colors.text },
    rowLabel: { color: colors.text },
    rowSublabel: { color: colors.textMuted },
    chevron: { color: colors.textMuted },
    switchTrack: {
      false: colors.surfaceVariant,
      true: colors.primary + "40",
    } as { false: string; true: string },
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
        {children}
      </View>
    </View>
  );

  const renderToggleRow = (
    label: string,
    value: boolean,
    onToggle: () => void,
    subtitle?: string
  ) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, themedStyles.rowLabel]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSublabel, themedStyles.rowSublabel]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={themedStyles.switchTrack}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  const renderArrowRow = (label: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, themedStyles.rowLabel]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSublabel, themedStyles.rowSublabel]}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={themedStyles.chevron} />
    </TouchableOpacity>
  );

  const renderSegmentedControl = <T extends string>(
    options: { key: T; label: string }[],
    selected: T,
    onSelect: (key: T) => void
  ) => (
    <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceVariant }]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.segmentOption,
            selected === opt.key && { backgroundColor: colors.primary },
          ]}
          onPress={() => onSelect(opt.key)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: FontSizes.sm,
              fontWeight: "600",
              color: selected === opt.key ? "#FFFFFF" : colors.textMuted,
            }}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Profile Section */}
        {renderSection(
          "Profile",
          <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                john.doe@email.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        )}

        {/* Notification Settings */}
        {renderSection(
          "Notifications",
          <>
            {renderToggleRow(
              "Weather Alerts",
              settings.notificationPrefs.weatherAlerts,
              () => toggleNotification("weatherAlerts")
            )}
            {renderToggleRow(
              "Earthquake Alerts",
              settings.notificationPrefs.earthquakes,
              () => toggleNotification("earthquakes")
            )}
            {renderToggleRow(
              "Flood Alerts",
              settings.notificationPrefs.floods,
              () => toggleNotification("floods")
            )}
            {renderToggleRow(
              "Wildfire Alerts",
              settings.notificationPrefs.wildfires,
              () => toggleNotification("wildfires")
            )}
            {renderToggleRow(
              "Storm Alerts",
              settings.notificationPrefs.storms,
              () => toggleNotification("storms")
            )}
            {renderToggleRow(
              "Emergency Broadcasts",
              settings.notificationPrefs.emergencyBroadcasts,
              () => toggleNotification("emergencyBroadcasts"),
              "Critical emergency alerts"
            )}
          </>
        )}

        {/* Alert Distance */}
        {renderSection(
          "Alert Distance",
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowTextContainer}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Alert Radius: {Math.round(settings.alertDistance / 1000)}km
              </Text>
              <Text style={[styles.rowSublabel, { color: colors.textMuted }]}>
                Receive alerts within this distance
              </Text>
            </View>
          </View>
        )}

        {/* Severity Threshold */}
        {renderSection(
          "Severity Threshold",
          <View style={styles.severityOptions}>
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = settings.severityFilter.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.severityChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                      borderColor: isSelected ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => {
                    const updated = isSelected
                      ? settings.severityFilter.filter((s) => s !== opt.key)
                      : [...settings.severityFilter, opt.key];
                    updateSettings({ severityFilter: updated });
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: FontSizes.sm,
                      fontWeight: "600",
                      color: isSelected ? "#FFFFFF" : colors.textMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Appearance */}
        {renderSection(
          "Appearance",
          <>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
              </View>
            </View>
            <View style={styles.themeOptions}>
              {THEME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor:
                        mode === opt.key ? colors.primary : colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => setTheme(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={mode === opt.key ? "#FFFFFF" : colors.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: FontSizes.sm,
                      fontWeight: "600",
                      color: mode === opt.key ? "#FFFFFF" : colors.textMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Units */}
        {renderSection(
          "Units",
          <>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Temperature</Text>
              {renderSegmentedControl(TEMP_UNITS, settings.temperatureUnit, (unit) =>
                updateSettings({ temperatureUnit: unit })
              )}
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Wind Speed</Text>
              {renderSegmentedControl(WIND_UNITS, settings.windSpeedUnit, (unit) =>
                updateSettings({ windSpeedUnit: unit })
              )}
            </View>
          </>
        )}

        {/* Saved Locations */}
        {renderSection(
          "Saved Locations",
          <>
            {savedLocations.map((loc, idx) => (
              <TouchableOpacity
                key={loc.id}
                style={[styles.locationRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.locationIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons
                    name={loc.isDefault ? "home" : "briefcase"}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, { color: colors.text }]}>{loc.name}</Text>
                  <Text style={[styles.locationAddress, { color: colors.textMuted }]}>
                    {loc.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addLocationButton} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addLocationText, { color: colors.primary }]}>
                Add Location
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Emergency Contacts */}
        {renderSection(
          "Emergency Contacts",
          <>
            {contacts.map((contact) => (
              <View
                key={contact.id}
                style={[styles.contactRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.contactAvatar, { backgroundColor: colors.secondary + "20" }]}>
                  <Text style={[styles.contactInitials, { color: colors.secondary }]}>
                    {contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                    {contact.phone}
                  </Text>
                </View>
                <Text style={[styles.contactRelationship, { color: colors.textMuted }]}>
                  {contact.relationship}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addContactButton} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addContactText, { color: colors.primary }]}>
                Add Contact
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Language */}
        {renderSection(
          "Language",
          renderArrowRow("Language", "English (US)", () => {
            Alert.alert("Language", "Language selection coming soon!");
          })
        )}

        {/* About */}
        {renderSection(
          "About",
          <>
            {renderArrowRow("App Version", APP_CONFIG.VERSION)}
            {renderArrowRow("Privacy Policy", undefined, () => {})}
            {renderArrowRow("Terms of Service", undefined, () => {})}
            {renderArrowRow("Rate the App", undefined, () => {})}
            {renderArrowRow("Contact Support", undefined, () => {})}
          </>
        )}

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
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSizes.md,
    fontWeight: "500",
  },
  rowSublabel: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: FontSizes.sm,
  },
  themeOptions: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  segmentOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md - 2,
  },
  severityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  severityChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  locationName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  locationAddress: {
    fontSize: FontSizes.sm,
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  addLocationText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  contactPhone: {
    fontSize: FontSizes.sm,
  },
  contactRelationship: {
    fontSize: FontSizes.sm,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  addContactText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
});
