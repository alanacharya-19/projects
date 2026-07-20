import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { Shadows, Gradients } from "@/constants/theme";
import { APP_CONFIG } from "@/constants/config";
import GradientBackground from "@/components/GradientBackground";

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "emergency", title: "Emergency SOS", icon: "alert-circle", iconColor: "#DC2626", iconBg: "#FEE2E2", route: "/emergency" },
  { id: "earthquake", title: "Earthquake Monitor", icon: "earth", iconColor: "#EA580C", iconBg: "#FFF7ED", route: "/earthquake-monitor" },
  { id: "flood", title: "Flood Monitor", icon: "water", iconColor: "#2563EB", iconBg: "#EFF6FF", route: "/flood-monitor" },
  { id: "wildfire", title: "Wildfire Monitor", icon: "flame", iconColor: "#DC2626", iconBg: "#FEF2F2", route: "/wildfire-monitor" },
  { id: "survival", title: "Survival Guide", icon: "book", iconColor: "#16A34A", iconBg: "#F0FDF4", route: "/survival-guide" },
  { id: "services", title: "Nearby Services", icon: "location", iconColor: "#4F46E5", iconBg: "#EEF2FF", route: "/nearby-services" },
  { id: "statistics", title: "Statistics", icon: "bar-chart", iconColor: "#7C3AED", iconBg: "#F5F3FF", route: "/statistics" },
  { id: "feed", title: "Global Feed", icon: "globe", iconColor: "#0D9488", iconBg: "#F0FDFA", route: "/global-feed" },
  { id: "ai", title: "AI Assistant", icon: "chatbubble-ellipses", iconColor: "#7C3AED", iconBg: "#F5F3FF", route: "/ai-chat" },
  { id: "settings", title: "Settings", icon: "settings", iconColor: "#64748B", iconBg: "#F1F5F9", route: "/settings" },
];

export default function MoreScreen() {
  const { colors, resolvedMode } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === "dark" ? Gradients.homeDark : Gradients.home;
  }, [resolvedMode]);

  const handleNavigate = useCallback(
    (route: string) => router.push(route as any),
    [router]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <GradientBackground colors={gradientColors}>
      <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "default"} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Profile Card */}
        <LinearGradient
          colors={
            resolvedMode === "dark"
              ? (["rgba(31,41,55,0.9)", "rgba(17,24,39,0.5)"] as const)
              : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.55)"] as const)
          }
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={Gradients.primary}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>JD</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>john.doe@email.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </LinearGradient>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Explore all features</Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {
                  backgroundColor: resolvedMode === "dark" ? "rgba(31,41,55,0.7)" : "rgba(255,255,255,0.7)",
                  ...Shadows.sm,
                },
              ]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={24} color={item.iconColor} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.menuChevron} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerName, { color: colors.textMuted }]}>{APP_CONFIG.NAME}</Text>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>Version {APP_CONFIG.VERSION}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 24,
    marginTop: 48,
    marginBottom: 28,
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  menuItem: {
    width: "47.5%",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },
  menuChevron: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 36,
    gap: 6,
  },
  footerName: { fontSize: 15, fontWeight: "700" },
  footerVersion: { fontSize: 12 },
});
