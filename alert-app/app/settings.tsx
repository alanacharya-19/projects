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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useAppContext } from "@/context/AppContext";
import GradientBackground from "@/components/GradientBackground";
import { Gradients } from "@/constants/theme";
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
  const { colors, mode, setTheme, resolvedMode } = useTheme();
  const { state, updateSettings, updateNotificationPrefs } = useAppContext();
  const insets = useSafeAreaInsets();
  const { settings } = state;

  const isDark = resolvedMode === "dark";

  const [contacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", phoneNumber: "+91 98765 43210", relationship: "Family", isPrimary: true },
    { id: "2", name: "Dad", phoneNumber: "+91 98765 43211", relationship: "Family", isPrimary: false },
  ]);

  const [savedLocations] = useState<SavedLocation[]>([
    { id: "1", name: "Home", address: "123 Main Street, New Delhi", coordinates: { latitude: 28.6139, longitude: 77.209 }, isDefault: true, createdAt: Date.now() },
    { id: "2", name: "Office", address: "456 Business Park, Gurgaon", coordinates: { latitude: 28.4595, longitude: 77.0266 }, isDefault: false, createdAt: Date.now() },
  ]);

  const { notificationPrefs } = settings;

  const toggleNotification = useCallback(
    (key: keyof typeof notificationPrefs) => {
      updateNotificationPrefs({ [key]: !(notificationPrefs as any)[key] });
    },
    [notificationPrefs, updateNotificationPrefs]
  );

  const glassBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1,
          color: colors.textMuted,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <LinearGradient
        colors={isDark ? Gradients.glassDark : Gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: glassBorder,
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );

  const renderToggleRow = (label: string, value: boolean, onToggle: () => void, subtitle?: string) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: dividerColor,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{label}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, marginTop: 2, color: colors.textMuted }}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: isDark ? "rgba(255,255,255,0.1)" : colors.surfaceVariant, true: colors.primary + "40" }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  const renderArrowRow = (label: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: dividerColor,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{label}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, marginTop: 2, color: colors.textMuted }}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderSegmentedControl = <T extends string>(
    options: { key: T; label: string }[],
    selected: T,
    onSelect: (key: T) => void
  ) => (
    <View
      style={{
        flexDirection: "row",
        borderRadius: 12,
        padding: 3,
        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      }}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: selected === opt.key ? colors.primary : "transparent",
          }}
          onPress={() => onSelect(opt.key)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 12,
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
    <GradientBackground colors={isDark ? Gradients.homeDark : Gradients.home}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 24 }}>
          Settings
        </Text>

        {/* Profile Section */}
        {renderSection(
          "PROFILE",
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: dividerColor,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>JD</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>John Doe</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>john.doe@email.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        )}

        {/* Notifications */}
        {renderSection(
          "NOTIFICATIONS",
          <>
            {renderToggleRow("Weather Alerts", settings.notificationPrefs.weatherAlerts, () => toggleNotification("weatherAlerts"))}
            {renderToggleRow("Earthquake Alerts", settings.notificationPrefs.earthquakes, () => toggleNotification("earthquakes"))}
            {renderToggleRow("Flood Alerts", settings.notificationPrefs.floods, () => toggleNotification("floods"))}
            {renderToggleRow("Wildfire Alerts", settings.notificationPrefs.wildfires, () => toggleNotification("wildfires"))}
            {renderToggleRow("Storm Alerts", settings.notificationPrefs.storms, () => toggleNotification("storms"))}
            {renderToggleRow("Emergency Broadcasts", settings.notificationPrefs.emergencyBroadcasts, () => toggleNotification("emergencyBroadcasts"), "Critical emergency alerts")}
          </>
        )}

        {/* Alert Distance */}
        {renderSection(
          "ALERT DISTANCE",
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
                Alert Radius: {Math.round(settings.alertDistance / 1000)}km
              </Text>
              <Text style={{ fontSize: 12, marginTop: 2, color: colors.textMuted }}>
                Receive alerts within this distance
              </Text>
            </View>
          </View>
        )}

        {/* Severity Threshold */}
        {renderSection(
          "SEVERITY THRESHOLD",
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 12,
            }}
          >
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = settings.severityFilter.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 9999,
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    borderColor: isSelected ? colors.primary : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                  }}
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
                      fontSize: 13,
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
          "APPEARANCE",
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: dividerColor,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Theme</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 }}>
              {THEME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: mode === opt.key ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                  }}
                  onPress={() => setTheme(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon} size={20} color={mode === opt.key ? "#FFFFFF" : colors.textMuted} />
                  <Text
                    style={{
                      fontSize: 13,
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
          "UNITS",
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: dividerColor,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Temperature</Text>
              {renderSegmentedControl(TEMP_UNITS, settings.temperatureUnit, (unit) => updateSettings({ temperatureUnit: unit }))}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Wind Speed</Text>
              {renderSegmentedControl(WIND_UNITS, settings.windSpeedUnit, (unit) => updateSettings({ windSpeedUnit: unit }))}
            </View>
          </>
        )}

        {/* Saved Locations */}
        {renderSection(
          "SAVED LOCATIONS",
          <>
            {savedLocations.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: dividerColor,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={loc.isDefault ? "home" : "briefcase"} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{loc.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{loc.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 14,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>Add Location</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Emergency Contacts */}
        {renderSection(
          "EMERGENCY CONTACTS",
          <>
            {contacts.map((contact) => (
              <View
                key={contact.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: dividerColor,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.secondary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.secondary }}>
                    {contact.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{contact.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{contact.phoneNumber}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{contact.relationship}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 14,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>Add Contact</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Language */}
        {renderSection(
          "LANGUAGE",
          renderArrowRow("Language", "English (US)", () => Alert.alert("Language", "Language selection coming soon!"))
        )}

        {/* About */}
        {renderSection(
          "ABOUT",
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
    </GradientBackground>
  );
}
