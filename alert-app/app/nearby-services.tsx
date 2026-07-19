import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import SearchBar from "@/components/SearchBar";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows } from "@/constants/theme";
import { calculateDistance } from "@/services/locationService";

type ServiceCategory = "all" | "hospitals" | "police" | "fire" | "shelters" | "food" | "water";

const CATEGORIES: { key: ServiceCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All", icon: "grid" },
  { key: "hospitals", label: "Hospitals", icon: "medkit" },
  { key: "police", label: "Police", icon: "shield-checkmark" },
  { key: "fire", label: "Fire", icon: "flame" },
  { key: "shelters", label: "Shelters", icon: "home" },
  { key: "food", label: "Food", icon: "restaurant" },
  { key: "water", label: "Water", icon: "water" },
];

interface NearbyService {
  id: string;
  name: string;
  category: ServiceCategory;
  distance: number;
  isOpen: boolean;
  phone: string;
  address: string;
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

const CATEGORY_ICONS: Record<ServiceCategory, keyof typeof Ionicons.glyphMap> = {
  all: "grid", hospitals: "medkit", police: "shield-checkmark", fire: "flame", shelters: "home", food: "restaurant", water: "water",
};
const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  all: "#64748B", hospitals: "#DC2626", police: "#1E40AF", fire: "#EA580C", shelters: "#16A34A", food: "#D97706", water: "#0EA5E9",
};

export default function NearbyServicesScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
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
    const url = Platform.select({ ios: `maps:0,0?q=${latitude},${longitude}`, android: `geo:0,0?q=${latitude},${longitude}`, default: `https://www.google.com/maps?q=${latitude},${longitude}` });
    Linking.openURL(url);
  }, []);

  const handleCall = useCallback((phone: string) => Linking.openURL(`tel:${phone}`), []);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <GradientBackground colors={gradientColors}>
      <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Services</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Emergency services near your location</Text>
        </View>

        {/* Map Placeholder */}
        <LinearGradient
          colors={resolvedMode === "dark" ? ["rgba(31,41,55,0.7)", "rgba(17,24,39,0.5)"] : ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.mapPlaceholder, Shadows.md]}
        >
          <Ionicons name="map" size={40} color={colors.textMuted} />
          <Text style={[styles.mapText, { color: colors.text }]}>Map View</Text>
          <Text style={[styles.mapSubtext, { color: colors.textMuted }]}>Tap to expand</Text>
        </LinearGradient>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search services..."
            colors={{ card: colors.surface, text: colors.text, textMuted: colors.textMuted, cardAlt: colors.surfaceVariant, accent: colors.primary }} />
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, {
                  backgroundColor: isActive ? CATEGORY_COLORS[cat.key] + "20" : (resolvedMode === "dark" ? "rgba(31,41,55,0.6)" : "rgba(255,255,255,0.7)"),
                  borderColor: isActive ? CATEGORY_COLORS[cat.key] : (resolvedMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                }]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={cat.icon} size={16} color={isActive ? CATEGORY_COLORS[cat.key] : colors.textMuted} />
                <Text style={[styles.categoryChipText, { color: isActive ? CATEGORY_COLORS[cat.key] : colors.textMuted }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Service Cards */}
        <View style={styles.servicesList}>
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No services found nearby</Text>
            </View>
          ) : (
            services.map((service) => {
              const catColor = CATEGORY_COLORS[service.category];
              return (
                <LinearGradient
                  key={service.id}
                  colors={resolvedMode === "dark" ? ["rgba(31,41,55,0.85)", "rgba(17,24,39,0.55)"] : ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.5)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.serviceCard, Shadows.md]}
                >
                  <View style={styles.serviceCardTop}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: catColor + "15" }]}>
                      <Ionicons name={CATEGORY_ICONS[service.category]} size={22} color={catColor} />
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                      <Text style={[styles.serviceAddress, { color: colors.textSecondary }]}>{service.address}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: service.isOpen ? colors.successLight : colors.errorLight }]}>
                      <View style={[styles.statusDot, { backgroundColor: service.isOpen ? colors.success : colors.error }]} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: service.isOpen ? colors.success : colors.error }}>
                        {service.isOpen ? "Open" : "Closed"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.serviceDistance, { borderTopColor: resolvedMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                    <Ionicons name="navigate" size={14} color={colors.textMuted} />
                    <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{formatDistance(service.distance)}</Text>
                  </View>

                  <View style={styles.serviceActions}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => handleNavigate(service)} activeOpacity={0.7}>
                      <Ionicons name="navigate" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: "transparent" }]} onPress={() => handleCall(service.phone)} activeOpacity={0.7}>
                      <Ionicons name="call" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  header: { marginTop: 48, marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "700", marginBottom: 6, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, fontWeight: "500" },
  mapPlaceholder: {
    height: 170,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  mapText: { fontSize: 16, fontWeight: "600" },
  mapSubtext: { fontSize: 12 },
  searchContainer: { marginBottom: 14 },
  categoriesContainer: { gap: 10, paddingBottom: 20 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  servicesList: { gap: 14 },
  serviceCard: { borderRadius: 24, padding: 18 },
  serviceCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  serviceIconContainer: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  serviceAddress: { fontSize: 13, fontWeight: "400" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  serviceDistance: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 14 },
  distanceText: { fontSize: 13, fontWeight: "500" },
  serviceActions: { flexDirection: "row", gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  actionButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "500" },
});
