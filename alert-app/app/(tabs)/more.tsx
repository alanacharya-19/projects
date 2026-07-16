import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";
import { APP_CONFIG } from "@/constants/config";

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "emergency",
    title: "Emergency SOS",
    subtitle: "Quick emergency access",
    icon: "alert-circle",
    iconColor: "#DC2626",
    route: "/emergency",
  },
  {
    id: "earthquake",
    title: "Earthquake Monitor",
    subtitle: "Live seismic activity",
    icon: "earth",
    iconColor: "#92400E",
    route: "/earthquake-monitor",
  },
  {
    id: "flood",
    title: "Flood Monitor",
    subtitle: "Flood risk & warnings",
    icon: "water",
    iconColor: "#1D4ED8",
    route: "/flood-monitor",
  },
  {
    id: "wildfire",
    title: "Wildfire Monitor",
    subtitle: "Active fire tracking",
    icon: "flame",
    iconColor: "#DC2626",
    route: "/wildfire-monitor",
  },
  {
    id: "survival",
    title: "Survival Guide",
    subtitle: "Disaster preparedness",
    icon: "book",
    iconColor: "#16A34A",
    route: "/survival-guide",
  },
  {
    id: "services",
    title: "Nearby Services",
    subtitle: "Hospitals, police, fire",
    icon: "location",
    iconColor: "#0EA5E9",
    route: "/nearby-services",
  },
  {
    id: "statistics",
    title: "Statistics",
    subtitle: "Weather & disaster data",
    icon: "bar-chart",
    iconColor: "#7C3AED",
    route: "/statistics",
  },
  {
    id: "feed",
    title: "Global Feed",
    subtitle: "Worldwide disaster news",
    icon: "globe",
    iconColor: "#0891B2",
    route: "/global-feed",
  },
  {
    id: "ai",
    title: "AI Assistant",
    subtitle: "Weather & safety answers",
    icon: "chatbubble-ellipses",
    iconColor: "#7C3AED",
    route: "/ai-chat",
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "App preferences",
    icon: "settings",
    iconColor: "#64748B",
    route: "/settings",
  },
];

export default function MoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const renderItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors.surface, ...Shadows.sm }]}
      onPress={() => handleNavigate(item.route)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.menuIconContainer,
          { backgroundColor: item.iconColor + "15" },
        ]}
      >
        <Ionicons name={item.icon} size={26} color={item.iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Explore all features
          </Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map(renderItem)}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.textMuted }]}>
            {APP_CONFIG.NAME}
          </Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            Version {APP_CONFIG.VERSION}
          </Text>
          <Text style={[styles.appDesc, { color: colors.textMuted }]}>
            {APP_CONFIG.DESCRIPTION}
          </Text>
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
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.xxxl + Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
  },
  menuList: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: FontSizes.sm,
  },
  appInfo: {
    alignItems: "center",
    marginTop: Spacing.xxxl,
    gap: Spacing.xs,
  },
  appName: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  appVersion: {
    fontSize: FontSizes.sm,
  },
  appDesc: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
});
