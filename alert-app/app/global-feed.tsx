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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows, DISASTER_COLORS } from "@/constants/theme";
import { getSeverityColor, getDisasterEmoji, formatDate } from "@/utils/helpers";
import { AlertSeverity, DisasterType } from "@/types";
import { MOCK_FEED, type FeedItem } from "@/constants/mockData";

type FilterType = "country" | "type" | "severity" | "date";

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
  const router = useRouter();
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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const clearFilters = () => { setSelectedSeverity(null); setSelectedType(null); setActiveFilter(null); setShowFilterOptions(false); };

  const renderFilterOptions = () => {
    if (!showFilterOptions) return null;
    const options = activeFilter === "severity" ? SEVERITY_OPTIONS : activeFilter === "type" ? TYPE_OPTIONS : [];
    const selected = activeFilter === "severity" ? selectedSeverity : selectedType;
    return (
      <View style={[styles.filterOptionsContainer, { backgroundColor: colors.surface }, Shadows.md]}>          
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

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const typeColor = DISASTER_COLORS[item.type as keyof typeof DISASTER_COLORS] || "#64748B";
    return (
    <TouchableOpacity
      style={[styles.feedCard, { backgroundColor: colors.surface }, Shadows.md]}
      activeOpacity={0.7}
    >
      <View style={[styles.cardAccent, { backgroundColor: typeColor }]} />
      <View style={styles.feedCardInner}>
      <View style={styles.feedCardTop}>
        <View style={[styles.feedIconContainer, { backgroundColor: `${typeColor}15` }]}>
          <Text style={styles.feedIcon}>{getDisasterEmoji(item.type)}</Text>
        </View>
        <View style={styles.feedInfo}>
          <Text style={[styles.feedTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.feedLocation, { color: colors.textSecondary }]}>{item.location}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + "18" }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>{item.severity}</Text>
        </View>
      </View>
      <Text style={[styles.feedDescription, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      <View style={[styles.feedFooter, { borderTopColor: colors.divider }]}>
        <View style={styles.feedTime}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.feedTimeText, { color: colors.textMuted }]}>{formatDate(item.timestamp, "relative")}</Text>
        </View>
        <View style={[styles.chevronContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <GradientBackground
      colors={isDark ? Gradients.homeDark : Gradients.home}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? (["rgba(16,33,59,0.9)", "rgba(16,33,59,0.4)"] as const) : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.4)"] as const)}
        style={styles.headerBar}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Global Feed</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Real-time disaster events worldwide</Text>
          </View>
        </View>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <View style={[styles.searchInputWrap, { borderLeftColor: colors.border }]}>
            <TextInput
              style={{ flex: 1, fontSize: 14, fontWeight: "500", color: colors.text, paddingVertical: 0 }}
              value={search}
              onChangeText={setSearch}
              placeholder="Search disasters..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter.key ? colors.primary : colors.surface,
                  borderColor: activeFilter === filter.key ? colors.primary : colors.border,
                },
                Shadows.sm,
              ]}
              onPress={() => handleFilterPress(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: activeFilter === filter.key ? "#FFFFFF" : colors.textSecondary }}>{filter.label}</Text>
              <Ionicons name="chevron-down" size={14} color={activeFilter === filter.key ? "#FFFFFF" : colors.textMuted} />
            </TouchableOpacity>
          ))}
          {(selectedSeverity || selectedType) && (
            <TouchableOpacity style={[styles.clearFilterChip, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : `${colors.error}10`, borderColor: colors.error }]} onPress={clearFilters} activeOpacity={0.7}>
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
            <LinearGradient colors={["#ECFDF5", "#D1FAE5"]} style={styles.emptyIconContainer}>
              <Ionicons name="globe-outline" size={40} color="#22C55E" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: colors.text }]}>No disasters found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerBar: { paddingTop: 52, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, ...Shadows.sm },
  header: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", marginTop: 1 },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, ...Shadows.sm },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 10, borderLeftWidth: 1 },
  filtersRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  filtersContent: { gap: 8, paddingBottom: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  clearFilterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  clearFilterText: { fontSize: 13, fontWeight: "600" },
  filterOptionsContainer: { marginHorizontal: 20, marginBottom: 12, borderRadius: 24, padding: 16 },
  filterOptionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  filterOptionsTitle: { fontSize: 16, fontWeight: "700" },
  filterOptionsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOptionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  listContent: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 60 },
  feedCard: { flexDirection: "row", borderRadius: 24, overflow: "hidden" },
  cardAccent: { width: 4 },
  feedCardInner: { flex: 1, padding: 16 },
  feedCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  feedIconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  feedIcon: { fontSize: 26 },
  feedInfo: { flex: 1 },
  feedTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2, lineHeight: 22 },
  feedLocation: { fontSize: 13, fontWeight: "500" },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  feedDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  feedFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  feedTime: { flexDirection: "row", alignItems: "center", gap: 6 },
  feedTimeText: { fontSize: 13, fontWeight: "500" },
  chevronContainer: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  emptySubtext: { fontSize: 15, fontWeight: "500", textAlign: "center" },
});
