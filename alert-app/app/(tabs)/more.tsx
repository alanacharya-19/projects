import React, { useCallback } from "react";
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
import { useTheme } from "@/context/ThemeContext";
import { Shadows } from "@/constants/theme";
import { APP_CONFIG } from "@/constants/config";

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
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleNavigate = useCallback(
    (route: string) => router.push(route as any),
    [router]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="default" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, ...Shadows.md }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>john.doe@email.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Explore all features</Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.surface, ...Shadows.sm }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginTop: 48,
    marginBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 1 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  menuItem: {
    width: "47.5%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    top: 14,
    right: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    gap: 4,
  },
  footerName: { fontSize: 15, fontWeight: "700" },
  footerVersion: { fontSize: 12 },
});
