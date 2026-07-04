import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  value?: string;
  toggle?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
}

function SettingRow({ icon, label, subtitle, value, toggle, onToggle, onPress }: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !toggle}
      style={styles.settingRow}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={colors.accent.primary} />
      </View>
      <View style={styles.settingBody}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {toggle !== undefined && (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: colors.bg.elevated, true: colors.accent.primary + "80" }}
          thumbColor={toggle ? colors.accent.primary : colors.text.tertiary}
        />
      )}
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && !toggle && (
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({
    darkMode: true,
    autoPlay: false,
    rememberPosition: true,
    skipIntro: false,
    autoResume: true,
    haptics: true,
    reduceMotion: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const sections = [
    {
      title: "Appearance",
      rows: [
        {
          icon: "moon-outline" as const,
          label: "Dark Theme",
          toggle: settings.darkMode,
          onToggle: () => toggle("darkMode"),
        },
        {
          icon: "color-palette-outline" as const,
          label: "Accent Color",
          subtitle: "Customize app theme",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Playback",
      rows: [
        {
          icon: "play-outline" as const,
          label: "Auto-Play",
          subtitle: "Start playback automatically",
          toggle: settings.autoPlay,
          onToggle: () => toggle("autoPlay"),
        },
        {
          icon: "bookmark-outline" as const,
          label: "Remember Position",
          subtitle: "Resume from where you left off",
          toggle: settings.rememberPosition,
          onToggle: () => toggle("rememberPosition"),
        },
        {
          icon: "fast-forward-outline" as const,
          label: "Skip Intro",
          toggle: settings.skipIntro,
          onToggle: () => toggle("skipIntro"),
        },
        {
          icon: "play-skip-forward-outline" as const,
          label: "Auto-Resume",
          subtitle: "Automatically resume playback",
          toggle: settings.autoResume,
          onToggle: () => toggle("autoResume"),
        },
        {
          icon: "speedometer-outline" as const,
          label: "Default Speed",
          value: "1.0x",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Storage",
      rows: [
        {
          icon: "server-outline" as const,
          label: "Cache Size",
          value: "128 MB",
          onPress: () => {},
        },
        {
          icon: "trash-outline" as const,
          label: "Clear Cache",
          subtitle: "Free up storage space",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Accessibility",
      rows: [
        {
          icon: "accessibility-outline" as const,
          label: "Haptic Feedback",
          toggle: settings.haptics,
          onToggle: () => toggle("haptics"),
        },
        {
          icon: "eye-outline" as const,
          label: "Reduce Motion",
          subtitle: "Minimize animations",
          toggle: settings.reduceMotion,
          onToggle: () => toggle("reduceMotion"),
        },
        {
          icon: "text-outline" as const,
          label: "Large Text",
          toggle: false,
          onToggle: () => {},
        },
      ],
    },
    {
      title: "About",
      rows: [
        {
          icon: "information-circle-outline" as const,
          label: "Version",
          value: "1.0.0",
        },
        {
          icon: "code-slash-outline" as const,
          label: "Open Source Licenses",
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionBody}>
              {section.rows.map((row, idx) => (
                <SettingRow key={idx} {...row} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + spacing.sm }]}>
        {navItems.map((item) => (
          <Pressable
            key={item.path}
            onPress={() => router.push(item.path as any)}
            style={styles.navItem}
          >
            <Ionicons name={item.icon} size={22} color={item.active ? colors.accent.primary : colors.text.tertiary} />
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const navItems = [
  { label: "Home", icon: "home" as const, path: "/home" },
  { label: "Library", icon: "layers-outline" as const, path: "/library" },
  { label: "Search", icon: "search" as const, path: "/search" },
  { label: "Settings", icon: "settings-outline" as const, path: "/settings", active: true },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  scroll: { paddingHorizontal: spacing.xl },

  section: { marginBottom: spacing["3xl"] },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bg.glassBorder,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
  },
  settingBody: { flex: 1, gap: spacing.xxs },
  settingLabel: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  settingSubtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  settingValue: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },

  // Bottom Nav
  bottomNav: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: spacing.sm,
    backgroundColor: "rgba(10,10,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.bg.glassBorder,
  },
  navItem: { alignItems: "center", gap: spacing.xxs, paddingVertical: spacing.xs, paddingHorizontal: spacing.lg },
  navLabel: { color: colors.text.tertiary, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  navLabelActive: { color: colors.accent.primary },
});
