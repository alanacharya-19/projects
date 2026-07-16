import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import SearchBar from "@/components/SearchBar";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";
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
  {
    id: "1",
    name: "City General Hospital",
    category: "hospitals",
    distance: 850,
    isOpen: true,
    phone: "+91 11 2345 6789",
    address: "123 Health Avenue",
    coordinates: { latitude: 28.6145, longitude: 77.21 },
  },
  {
    id: "2",
    name: "Central Fire Station",
    category: "fire",
    distance: 1200,
    isOpen: true,
    phone: "101",
    address: "45 Safety Road",
    coordinates: { latitude: 28.616, longitude: 77.208 },
  },
  {
    id: "3",
    name: "Metro Police Station",
    category: "police",
    distance: 650,
    isOpen: true,
    phone: "100",
    address: "78 Justice Lane",
    coordinates: { latitude: 28.613, longitude: 77.212 },
  },
  {
    id: "4",
    name: "Red Cross Shelter",
    category: "shelters",
    distance: 2300,
    isOpen: true,
    phone: "+91 11 9876 5432",
    address: "200 Relief Street",
    coordinates: { latitude: 28.61, longitude: 77.215 },
  },
  {
    id: "5",
    name: "Emergency Food Bank",
    category: "food",
    distance: 1800,
    isOpen: false,
    phone: "+91 11 4567 8901",
    address: "55 Community Road",
    coordinates: { latitude: 28.618, longitude: 77.206 },
  },
  {
    id: "6",
    name: "Clean Water Distribution",
    category: "water",
    distance: 950,
    isOpen: true,
    phone: "+91 11 2222 3333",
    address: "300 Supply Avenue",
    coordinates: { latitude: 28.612, longitude: 77.209 },
  },
  {
    id: "7",
    name: "St. Mary's Medical Center",
    category: "hospitals",
    distance: 3400,
    isOpen: true,
    phone: "+91 11 3333 4444",
    address: "88 Cure Road",
    coordinates: { latitude: 28.62, longitude: 77.22 },
  },
  {
    id: "8",
    name: "North Fire Station",
    category: "fire",
    distance: 4100,
    isOpen: true,
    phone: "101",
    address: "15 Blaze Street",
    coordinates: { latitude: 28.625, longitude: 77.205 },
  },
];

const CATEGORY_ICONS: Record<ServiceCategory, keyof typeof Ionicons.glyphMap> = {
  all: "grid",
  hospitals: "medkit",
  police: "shield-checkmark",
  fire: "flame",
  shelters: "home",
  food: "restaurant",
  water: "water",
};

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  all: "#64748B",
  hospitals: "#DC2626",
  police: "#1E40AF",
  fire: "#EA580C",
  shelters: "#16A34A",
  food: "#D97706",
  water: "#0EA5E9",
};

export default function NearbyServicesScreen() {
  const { colors } = useTheme();
  const { location } = useLocation();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [search, setSearch] = useState("");

  const services = useMemo(() => {
    let filtered = MOCK_SERVICES;

    if (activeCategory !== "all") {
      filtered = filtered.filter((s) => s.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    if (location) {
      filtered = filtered.map((s) => ({
        ...s,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          s.coordinates.latitude,
          s.coordinates.longitude
        ),
      }));
    }

    return filtered.sort((a, b) => a.distance - b.distance);
  }, [activeCategory, search, location]);

  const handleNavigate = useCallback((service: NearbyService) => {
    const { latitude, longitude } = service.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  }, []);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderServiceCard = ({ item }: { item: NearbyService }) => {
    const catColor = CATEGORY_COLORS[item.category];

    return (
      <View style={[styles.serviceCard, { backgroundColor: colors.surface, ...Shadows.md }]}>
        <View style={styles.serviceCardTop}>
          <View style={[styles.serviceIconContainer, { backgroundColor: catColor + "20" }]}>
            <Ionicons name={CATEGORY_ICONS[item.category]} size={24} color={catColor} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.serviceAddress, { color: colors.textMuted }]}>
              {item.address}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isOpen ? colors.successLight : colors.errorLight,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isOpen ? colors.success : colors.error },
              ]}
            />
            <Text
              style={{
                fontSize: FontSizes.xs,
                fontWeight: "600",
                color: item.isOpen ? colors.success : colors.error,
              }}
            >
              {item.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        <View style={[styles.serviceDistance, { borderColor: colors.border }]}>
          <Ionicons name="navigate" size={16} color={colors.textMuted} />
          <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
            {formatDistance(item.distance)}
          </Text>
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.navigateButton, { backgroundColor: colors.primary }]}
            onPress={() => handleNavigate(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton, { borderColor: colors.primary }]}
            onPress={() => handleCall(item.phone)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Services</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Emergency services near your location
          </Text>
        </View>

        {/* Map Preview Placeholder */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceVariant, ...Shadows.sm }]}>
          <Ionicons name="map" size={40} color={colors.textMuted} />
          <Text style={[styles.mapPlaceholderText, { color: colors.textMuted }]}>
            Map View
          </Text>
          <Text style={[styles.mapPlaceholderSubtext, { color: colors.textMuted }]}>
            Tap to expand
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search services..."
            colors={{
              card: colors.surface,
              text: colors.text,
              textMuted: colors.textMuted,
              cardAlt: colors.surfaceVariant,
              accent: colors.primary,
            }}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    activeCategory === cat.key
                      ? CATEGORY_COLORS[cat.key] + "20"
                      : colors.surfaceVariant,
                  borderColor:
                    activeCategory === cat.key
                      ? CATEGORY_COLORS[cat.key]
                      : "transparent",
                },
              ]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={
                  activeCategory === cat.key
                    ? CATEGORY_COLORS[cat.key]
                    : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      activeCategory === cat.key
                        ? CATEGORY_COLORS[cat.key]
                        : colors.textMuted,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Service Cards */}
        <View style={styles.servicesList}>
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No services found nearby
              </Text>
            </View>
          ) : (
            services.map((service) => (
              <View key={service.id}>{renderServiceCard({ item: service })}</View>
            ))
          )}
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
  mapPlaceholder: {
    height: 160,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  mapPlaceholderText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
  mapPlaceholderSubtext: {
    fontSize: FontSizes.sm,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  categoriesContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  servicesList: {
    gap: Spacing.md,
  },
  serviceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  serviceCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceAddress: {
    fontSize: FontSizes.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serviceDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginBottom: Spacing.md,
  },
  distanceText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  serviceActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  navigateButton: {},
  callButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  actionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
  },
});
