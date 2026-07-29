import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows } from "@/constants/theme";
import { calculateDistance } from "@/services/locationService";

type ServiceCategory = "all" | "hospitals" | "police" | "fire" | "shelters" | "food" | "water";

const CATEGORIES: { key: ServiceCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "all", label: "All", icon: "grid", color: "#64748B" },
  { key: "hospitals", label: "Hospitals", icon: "medkit", color: "#DC2626" },
  { key: "police", label: "Police", icon: "shield-checkmark", color: "#1E40AF" },
  { key: "fire", label: "Fire", icon: "flame", color: "#EA580C" },
  { key: "shelters", label: "Shelters", icon: "home", color: "#16A34A" },
  { key: "food", label: "Food", icon: "restaurant", color: "#D97706" },
  { key: "water", label: "Water", icon: "water", color: "#0EA5E9" },
];

interface NearbyService {
  id: string; name: string; category: ServiceCategory;
  distance: number; isOpen: boolean; phone: string; address: string;
  coordinates: { latitude: number; longitude: number };
}

const MOCK_SERVICES: NearbyService[] = [
  { id: "1", name: "City General Hospital", category: "hospitals", distance: 850, isOpen: true, phone: "+91 11 2345 6789", address: "123 Health Avenue", coordinates: { latitude: 28.6145, longitude: 77.21 } },
  { id: "2", name: "Central Fire Station", category: "fire", distance: 1200, isOpen: true, phone: "101", address: "45 Safety Road", coordinates: { latitude: 28.616, longitude: 77.208 } },
  { id: "3", name: "Metro Police Station", category: "police", distance: 650, isOpen: true, phone: "100", address: "78 Justice Lane", coordinates: { latitude: 28.613, longitude: 77.212 } },
  { id: "4", name: "Red Cross Shelter", category: "shelters", distance: 2300, isOpen: true, phone: "+91 11 9876 5432", address: "200 Relief Street", coordinates: { latitude: 28.61, longitude: 77.215 } },
  { id: "5", name: "Emergency Food Bank", category: "food", distance: 1800, isOpen: false, phone: "+91 11 4567 8901", address: "55 Community Road", coordinates: { latitude: 28.618, longitude: 77.206 } },
  { id: "6", name: "Clean Water Distribution", category: "water", distance: 950, isOpen: true, phone: "+91 11 2222 3333", address: "300 Supply Avenue", coordinates: { latitude: 28.612, longitude: 77.209 } },
  { id: "7", name: "St. Mary's Medical Center", category: "hospitals", distance: 3400, isOpen: true, phone: "+91 11 3333 4444", address: "88 Cure Road", coordinates: { latitude: 28.62, longitude: 77.22 } },
  { id: "8", name: "North Fire Station", category: "fire", distance: 4100, isOpen: true, phone: "101", address: "15 Blaze Street", coordinates: { latitude: 28.625, longitude: 77.205 } },
];

function formatDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function NearbyServicesScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [search, setSearch] = useState("");

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === "dark" ? Gradients.forecastDark : Gradients.forecast;
  }, [resolvedMode]);

  const services = useMemo(() => {
    let filtered = MOCK_SERVICES;
    if (activeCategory !== "all") filtered = filtered.filter((s) => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
    }
    if (location) {
      filtered = filtered.map((s) => ({
        ...s,
        distance: calculateDistance(location.latitude, location.longitude, s.coordinates.latitude, s.coordinates.longitude),
      }));
    }
    return filtered.sort((a, b) => a.distance - b.distance);
  }, [activeCategory, search, location]);

  const handleNavigate = useCallback((service: NearbyService) => {
    const { latitude, longitude } = service.coordinates;
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
  }, []);

  const handleCall = useCallback((phone: string) => Linking.openURL(`tel:${phone}`), []);

  return (
    <GradientBackground colors={gradientColors}>
      <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={resolvedMode === "dark"
          ? (["rgba(16,33,59,0.9)", "rgba(16,33,59,0.4)"] as const)
          : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.4)"] as const)}
        style={styles.topBar}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.text }]}>Medical Services</Text>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <View style={[styles.searchInputWrap, { borderLeftColor: colors.border }]}>
            <TextInput
              style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text, paddingVertical: 0 }}
              value={search}
              onChangeText={setSearch}
              placeholder="Search services..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mapPreview}>
          <View style={styles.mapInner}>
            <View style={styles.mapGrid}>
              <View style={[styles.mapGridLine, styles.mapGridLineH1]} />
              <View style={[styles.mapGridLine, styles.mapGridLineH2]} />
              <View style={[styles.mapGridLine, styles.mapGridLineV1]} />
              <View style={[styles.mapGridLine, styles.mapGridLineV2]} />
            </View>
            <View style={[styles.mapRoad, styles.mapRoad1]} />
            <View style={[styles.mapRoad, styles.mapRoad2]} />
            <View style={styles.mapPin}>
              <View style={styles.mapPinShadow} />
              <Ionicons name="location" size={40} color="#FF3B30" />
            </View>
            <View style={styles.mapLabelBox}>
              <Ionicons name="map" size={14} color="#FFFFFF" />
              <Text style={styles.mapLabel}>Map View</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryPill, {
                  backgroundColor: isActive ? cat.color : colors.surface,
                  borderColor: isActive ? cat.color : colors.border,
                }]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={cat.icon} size={15} color={isActive ? "#FFF" : cat.color} />
                <Text style={[styles.categoryLabel, { color: isActive ? "#FFF" : colors.textMuted }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.resultHeader}>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{services.length} services found</Text>
        </View>

        <View style={styles.list}>
          {services.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No services found</Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.cardIcon, { backgroundColor: (CATEGORIES.find((c) => c.key === service.category)?.color || "#64748B") + "15" }]}>
                    <Ionicons name={CATEGORIES.find((c) => c.key === service.category)?.icon || "location"} size={22} color={CATEGORIES.find((c) => c.key === service.category)?.color || "#64748B"} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.text }]}>{service.name}</Text>
                    <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{service.address}</Text>
                  </View>
                  <View style={[styles.distanceBadge, { backgroundColor: colors.primary + "12" }]}>
                    <Ionicons name="navigate" size={12} color={colors.primary} />
                    <Text style={[styles.distanceText, { color: colors.primary }]}>{formatDist(service.distance)}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <TouchableOpacity style={[styles.cardAction, { backgroundColor: colors.primary }]} onPress={() => handleNavigate(service)} activeOpacity={0.7}>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.cardActionText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cardAction, styles.cardActionOutline, { borderColor: colors.primary }]} onPress={() => handleCall(service.phone)} activeOpacity={0.7}>
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={[styles.cardActionText, { color: colors.primary }]}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 52,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, ...Shadows.sm },
  topTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, ...Shadows.sm,
  },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 10, borderLeftWidth: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  mapPreview: {
    height: 150, borderRadius: 24, overflow: "hidden", marginBottom: 20,
    ...Shadows.md,
  },
  mapInner: { flex: 1, backgroundColor: "#E8F0E6", position: "relative" },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  mapGridLine: { position: "absolute", backgroundColor: "rgba(0,0,0,0.06)" },
  mapGridLineH1: { left: 0, right: 0, top: "33%", height: 1 },
  mapGridLineH2: { left: 0, right: 0, top: "66%", height: 1 },
  mapGridLineV1: { top: 0, bottom: 0, left: "33%", width: 1 },
  mapGridLineV2: { top: 0, bottom: 0, left: "66%", width: 1 },
  mapRoad: { position: "absolute", backgroundColor: "rgba(255,255,255,0.7)" },
  mapRoad1: { left: "10%", right: "10%", top: "25%", height: "5%", borderRadius: 3 },
  mapRoad2: { top: "10%", bottom: "10%", left: "70%", width: "4%", borderRadius: 3 },
  mapPin: { position: "absolute", top: "50%", left: "50%", marginLeft: -20, marginTop: -30, alignItems: "center", zIndex: 10 },
  mapPinShadow: { position: "absolute", bottom: -2, width: 12, height: 4, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.15)" },
  mapLabelBox: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999,
  },
  mapLabel: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  categoriesScroll: { gap: 8, paddingBottom: 14 },
  categoryPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 9999, borderWidth: 1.5, ...Shadows.sm,
  },
  categoryLabel: { fontSize: 12, fontWeight: "600" },
  resultHeader: { marginBottom: 12 },
  resultCount: { fontSize: 13, fontWeight: "500" },
  list: { gap: 12 },
  card: {
    borderRadius: 24, padding: 16,
    ...Shadows.md,
  },
  cardTop: { flexDirection: "row", gap: 12, marginBottom: 14 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardAddress: { fontSize: 12, fontWeight: "400" },
  distanceBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    alignSelf: "flex-start",
  },
  distanceText: { fontSize: 11, fontWeight: "700" },
  cardBottom: { flexDirection: "row", gap: 10 },
  cardAction: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 16,
  },
  cardActionOutline: { borderWidth: 1.5, backgroundColor: "transparent" },
  cardActionText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "500" },
});
