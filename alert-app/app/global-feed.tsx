import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import SearchBar from "@/components/SearchBar";
import GradientBackground from "@/components/GradientBackground";
import { Gradients } from "@/constants/theme";
import { getSeverityColor, getDisasterEmoji, formatDate } from "@/utils/helpers";
import { AlertSeverity, DisasterType } from "@/types";

type FilterType = "country" | "type" | "severity" | "date";

interface FeedItem {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  severity: AlertSeverity;
  location: string;
  country: string;
  timestamp: number;
  coordinates: { latitude: number; longitude: number };
}

const MOCK_FEED: FeedItem[] = [
  { id: "f1", type: DisasterType.EARTHQUAKE, title: "6.2 Magnitude Earthquake", description: "Moderate earthquake felt across multiple districts. No major damage reported yet.", severity: AlertSeverity.SEVERE, location: "Tokyo, Japan", country: "Japan", timestamp: Date.now() - 3600000, coordinates: { latitude: 35.6762, longitude: 139.6503 } },
  { id: "f2", type: DisasterType.FLOOD, title: "Flash Flood Warning", description: "Heavy rainfall causing flash flooding in low-lying areas. Evacuations underway.", severity: AlertSeverity.EXTREME, location: "Mumbai, India", country: "India", timestamp: Date.now() - 7200000, coordinates: { latitude: 19.076, longitude: 72.8777 } },
  { id: "f3", type: DisasterType.WILDFIRE, title: "Wildfire Spreading", description: "Fast-moving wildfire threatening residential areas. Multiple structures at risk.", severity: AlertSeverity.EXTREME, location: "Los Angeles, USA", country: "USA", timestamp: Date.now() - 10800000, coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { id: "f4", type: DisasterType.CYCLONE, title: "Cyclone Approaching", description: "Category 3 cyclone expected to make landfall within 24 hours.", severity: AlertSeverity.SEVERE, location: "Brisbane, Australia", country: "Australia", timestamp: Date.now() - 14400000, coordinates: { latitude: -27.4698, longitude: 153.0251 } },
  { id: "f5", type: DisasterType.HEATWAVE, title: "Extreme Heatwave", description: "Temperatures exceeding 45°C expected for the next 5 days.", severity: AlertSeverity.MODERATE, location: "New Delhi, India", country: "India", timestamp: Date.now() - 18000000, coordinates: { latitude: 28.6139, longitude: 77.209 } },
  { id: "f6", type: DisasterType.EARTHQUAKE, title: "4.8 Magnitude Earthquake", description: "Light earthquake recorded. Minor structural damage in older buildings.", severity: AlertSeverity.MODERATE, location: "Istanbul, Turkey", country: "Turkey", timestamp: Date.now() - 21600000, coordinates: { latitude: 41.0082, longitude: 28.9784 } },
  { id: "f7", type: DisasterType.TSUNAMI, title: "Tsunami Advisory", description: "Small tsunami waves possible after offshore earthquake. Coastal areas on alert.", severity: AlertSeverity.SEVERE, location: "Santiago, Chile", country: "Chile", timestamp: Date.now() - 25200000, coordinates: { latitude: -33.4489, longitude: -70.6693 } },
  { id: "f8", type: DisasterType.LANDSLIDE, title: "Landslide After Heavy Rain", description: "Major landslide blocking major highway. Several homes evacuated.", severity: AlertSeverity.SEVERE, location: "Nepal", country: "Nepal", timestamp: Date.now() - 28800000, coordinates: { latitude: 27.7172, longitude: 85.324 } },
];

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "severity", label: "Severity" },
  { key: "country", label: "Country" },
  { key: "date", label: "Date" },
];

const SEVERITY_OPTIONS = [
  { key: AlertSeverity.MINOR, label: "Minor" },
  { key: AlertSeverity.MODERATE, label: "Moderate" },
  { key: AlertSeverity.SEVERE, label: "Severe" },
  { key: AlertSeverity.EXTREME, label: "Extreme" },
  { key: AlertSeverity.EMERGENCY, label: "Emergency" },
];

const TYPE_OPTIONS = [
  { key: DisasterType.EARTHQUAKE, label: "Earthquake" },
  { key: DisasterType.FLOOD, label: "Flood" },
  { key: DisasterType.WILDFIRE, label: "Wildfire" },
  { key: DisasterType.CYCLONE, label: "Cyclone" },
  { key: DisasterType.TSUNAMI, label: "Tsunami" },
  { key: DisasterType.HEATWAVE, label: "Heatwave" },
  { key: DisasterType.LANDSLIDE, label: "Landslide" },
];

export default function GlobalFeedScreen() {
  const { colors, resolvedMode } = useTheme();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | null>(null);
  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const isDark = resolvedMode === "dark";

  const filteredFeed = useMemo(() => {
    let items = MOCK_FEED;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.country.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    if (selectedSeverity) items = items.filter((item) => item.severity === selectedSeverity);
    if (selectedType) items = items.filter((item) => item.type === selectedType);
    return items;
  }, [search, selectedSeverity, selectedType]);

  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }, []);

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
    setShowFilterOptions(true);
    if (filter === "country" || filter === "date") { setShowFilterOptions(false); setActiveFilter(null); }
  };

  const clearFilters = () => { setSelectedSeverity(null); setSelectedType(null); setActiveFilter(null); setShowFilterOptions(false); };

  const renderFilterOptions = () => {
    if (!showFilterOptions) return null;
    const options = activeFilter === "severity" ? SEVERITY_OPTIONS : activeFilter === "type" ? TYPE_OPTIONS : [];
    const selected = activeFilter === "severity" ? selectedSeverity : selectedType;
    return (
      <View style={[styles.filterOptionsContainer, { backgroundColor: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)" }]}>
        <View style={styles.filterOptionsHeader}>
          <Text style={[styles.filterOptionsTitle, { color: colors.text }]}>Filter by {activeFilter}</Text>
          <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.filterOptionsList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterOptionChip, { backgroundColor: selected === opt.key ? colors.primary : isDark ? "rgba(31,41,55,0.6)" : "rgba(255,255,255,0.6)", borderColor: selected === opt.key ? colors.primary : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}
              onPress={() => {
                if (activeFilter === "severity") setSelectedSeverity(selectedSeverity === opt.key ? null : (opt.key as AlertSeverity));
                else setSelectedType(selectedType === opt.key ? null : (opt.key as DisasterType));
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: selected === opt.key ? "#FFFFFF" : colors.text }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity
      style={[
        styles.feedCard,
        { backgroundColor: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)" },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.feedCardTop}>
        <View style={[styles.feedIconContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}>
          <Text style={styles.feedIcon}>{getDisasterEmoji(item.type)}</Text>
        </View>
        <View style={styles.feedInfo}>
          <Text style={[styles.feedTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.feedLocation, { color: colors.textMuted }]}>{item.location}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + "18" }]}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: getSeverityColor(item.severity), textTransform: "capitalize" }}>{item.severity}</Text>
        </View>
      </View>
      <Text style={[styles.feedDescription, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      <View style={[styles.feedFooter, { borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <View style={styles.feedTime}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.feedTimeText, { color: colors.textMuted }]}>{formatDate(item.timestamp, "relative")}</Text>
        </View>
        <View style={[styles.chevronContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GradientBackground
      colors={isDark ? Gradients.homeDark : Gradients.home}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Global Feed</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Real-time disaster events worldwide</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search disasters..."
          colors={{ card: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)", text: colors.text, textMuted: colors.textMuted, cardAlt: isDark ? "rgba(31,41,55,0.6)" : "rgba(255,255,255,0.6)", accent: colors.primary }} />
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter.key
                    ? (isDark ? "rgba(129,140,248,0.2)" : "rgba(99,102,241,0.12)")
                    : isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)",
                  borderColor: activeFilter === filter.key
                    ? colors.primary
                    : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                },
              ]}
              onPress={() => handleFilterPress(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: activeFilter === filter.key ? colors.primary : colors.textMuted }}>{filter.label}</Text>
              <Ionicons name="chevron-down" size={14} color={activeFilter === filter.key ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          ))}
          {(selectedSeverity || selectedType) && (
            <TouchableOpacity style={[styles.clearFilterChip, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)", borderColor: colors.error }]} onPress={clearFilters} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={14} color={colors.error} />
              <Text style={[styles.clearFilterText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {renderFilterOptions()}

      <FlatList
        data={filteredFeed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)" }]}>
              <Ionicons name="globe-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No disasters found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: "500" },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  filtersRow: { marginBottom: 12 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  clearFilterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  clearFilterText: { fontSize: 13, fontWeight: "600" },
  filterOptionsContainer: { marginHorizontal: 20, marginBottom: 12, borderRadius: 20, padding: 16 },
  filterOptionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  filterOptionsTitle: { fontSize: 16, fontWeight: "700" },
  filterOptionsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOptionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  listContent: { padding: 20, paddingTop: 8, gap: 12, paddingBottom: 60 },
  feedCard: { borderRadius: 20, padding: 16 },
  feedCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  feedIconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  feedIcon: { fontSize: 26 },
  feedInfo: { flex: 1 },
  feedTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2, lineHeight: 22 },
  feedLocation: { fontSize: 13, fontWeight: "500" },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  feedDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  feedFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  feedTime: { flexDirection: "row", alignItems: "center", gap: 6 },
  feedTimeText: { fontSize: 13, fontWeight: "500" },
  chevronContainer: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13, fontWeight: "500" },
});
