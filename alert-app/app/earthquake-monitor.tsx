import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from '@/hooks/useLocation';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import GradientBackground from '@/components/GradientBackground';
import { Gradients } from '@/constants/theme';
import { type Alert } from '@/types';
import { formatDate, formatDistance } from '@/utils/helpers';
import { calculateDistance } from '@/services/locationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MagFilter = 'all' | 'minor' | 'moderate' | 'strong' | 'major';

interface EarthquakeEntry extends Alert {
  mag: number;
  depth: number;
  locationName: string;
  distance?: number;
}

const MAG_FILTERS: { key: MagFilter; label: string; min: number; max: number; color: string }[] = [
  { key: 'all', label: 'All', min: 0, max: 10, color: '#6B7280' },
  { key: 'minor', label: '< 4.0', min: 0, max: 4, color: '#16A34A' },
  { key: 'moderate', label: '4.0 – 6.0', min: 4, max: 6, color: '#F59E0B' },
  { key: 'strong', label: '6.0 – 7.0', min: 6, max: 7, color: '#F97316' },
  { key: 'major', label: '> 7.0', min: 7, max: 10, color: '#DC2626' },
];

function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return '#DC2626';
  if (mag >= 6) return '#F97316';
  if (mag >= 4) return '#F59E0B';
  return '#16A34A';
}

function getMagnitudeLabel(mag: number): string {
  if (mag >= 7) return 'Major';
  if (mag >= 6) return 'Strong';
  if (mag >= 4) return 'Moderate';
  return 'Minor';
}

export default function EarthquakeMonitorScreen() {
  const { colors, resolvedMode } = useTheme();
  const router = useRouter();
  const { location } = useLocation();

  const [earthquakes, setEarthquakes] = useState<EarthquakeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MagFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEarthquakes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fetchEarthquakes: fetchEq } = await import('@/services/disasterService');
      const alerts = await fetchEq(
        location
          ? { minLat: location.latitude - 5, minLon: location.longitude - 5, maxLat: location.latitude + 5, maxLon: location.longitude + 5 }
          : undefined
      );
      const entries: EarthquakeEntry[] = alerts.map((a) => {
        const meta: any = (a as any).metadata ?? {};
        const dist = location
          ? calculateDistance(location.latitude, location.longitude, a.coordinates.latitude, a.coordinates.longitude)
          : undefined;
        return { ...a, mag: meta.magnitude ?? 0, depth: meta.depth ?? 0, locationName: meta.locationName ?? a.title, distance: dist };
      });
      entries.sort((a, b) => b.startTime - a.startTime);
      setEarthquakes(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earthquakes');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => { fetchEarthquakes(); }, [fetchEarthquakes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEarthquakes();
    setRefreshing(false);
  }, [fetchEarthquakes]);

  const filteredEarthquakes = useMemo(() => {
    const f = MAG_FILTERS.find((m) => m.key === activeFilter) || MAG_FILTERS[0];
    return earthquakes.filter((eq) => eq.mag >= f.min && eq.mag < f.max);
  }, [earthquakes, activeFilter]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const maxMag = useMemo(() => Math.max(...earthquakes.map((e) => e.mag), 0), [earthquakes]);

  const stats = useMemo(() => {
    const major = earthquakes.filter((eq) => eq.mag >= 7).length;
    const strong = earthquakes.filter((eq) => eq.mag >= 6 && eq.mag < 7).length;
    const avgDepth = earthquakes.length > 0 ? earthquakes.reduce((s, e) => s + e.depth, 0) / earthquakes.length : 0;
    return { major, strong, avgDepth };
  }, [earthquakes]);

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? Gradients.alertDark : Gradients.alert}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Earthquake Monitor</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {earthquakes.length} event{earthquakes.length !== 1 ? 's' : ''} detected
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Stats Card */}
        <LinearGradient
          colors={resolvedMode === 'dark' ? Gradients.heroCardDark : Gradients.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconRow}>
            <Ionicons name="globe-outline" size={28} color="rgba(255,255,255,0.9)" />
            <View style={styles.heroBadge}>
              <Ionicons name="pulse" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.heroMaxMag}>M{maxMag.toFixed(1)}</Text>
          <Text style={styles.heroMaxLabel}>Maximum Magnitude</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{earthquakes.length}</Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#FCA5A5' }]}>{stats.major}</Text>
              <Text style={styles.heroStatLabel}>Major</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#FCD34D' }]}>{stats.strong}</Text>
              <Text style={styles.heroStatLabel}>Strong</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.avgDepth.toFixed(0)}</Text>
              <Text style={styles.heroStatLabel}>Avg km</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Map */}
        <View style={[styles.mapSection, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="globe-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.mapLabel, { color: colors.textMuted }]}>Earthquake Locations</Text>
          </View>
          <View style={styles.mapDots}>
            {filteredEarthquakes.slice(0, 30).map((eq) => {
              const offsetX = ((eq.coordinates.longitude % 10) / 10) * (SCREEN_WIDTH - 80);
              const offsetY = ((eq.coordinates.latitude % 5) / 5) * 140;
              return (
                <View
                  key={eq.id}
                  style={[
                    styles.mapDot,
                    {
                      left: 20 + Math.abs(offsetX),
                      top: 10 + Math.abs(offsetY),
                      backgroundColor: getMagnitudeColor(eq.mag),
                      width: Math.max(8, eq.mag * 3),
                      height: Math.max(8, eq.mag * 3),
                      borderRadius: Math.max(4, eq.mag * 1.5),
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={[styles.mapStats, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
            <Text style={[styles.mapStatsText, { color: colors.text }]}>
              Max: M{maxMag.toFixed(1)} · {filteredEarthquakes.length} shown
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by Magnitude</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {MAG_FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              const count = earthquakes.filter((eq) => eq.mag >= f.min && eq.mag < f.max).length;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? f.color + '20' : 'rgba(255,255,255,0.7)',
                      borderColor: isActive ? f.color : 'rgba(255,255,255,0.4)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.filterDot, { backgroundColor: f.color }]} />
                  <Text style={[styles.filterChipText, { color: isActive ? f.color : colors.textMuted }]}>
                    {f.label}
                  </Text>
                  <View style={[styles.filterCount, { backgroundColor: isActive ? f.color + '25' : 'rgba(255,255,255,0.5)' }]}>
                    <Text style={[styles.filterCountText, { color: isActive ? f.color : colors.textMuted }]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching earthquake data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState icon="alert-circle-outline" title="Error Loading Data" description={error} actionText="Retry" onAction={fetchEarthquakes}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : filteredEarthquakes.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="No Earthquakes Found" description="No earthquakes match the selected magnitude filter"
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : (
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: colors.text }]}>Latest Earthquakes</Text>
            {filteredEarthquakes.map((eq) => {
              const isExpanded = expandedId === eq.id;
              const magColor = getMagnitudeColor(eq.mag);
              const distText = eq.distance != null ? formatDistance(eq.distance) : null;
              return (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.eqCard, { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }]}
                  onPress={() => toggleExpand(eq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eqRow}>
                    <View style={[styles.magBadge, { backgroundColor: magColor + '15' }]}>
                      <Text style={[styles.magValue, { color: magColor }]}>{eq.mag.toFixed(1)}</Text>
                      <Text style={[styles.magLabel, { color: magColor }]}>MAG</Text>
                    </View>
                    <View style={styles.eqInfo}>
                      <Text style={[styles.eqLocation, { color: colors.text }]} numberOfLines={1}>{eq.locationName}</Text>
                      <View style={styles.eqMetaRow}>
                        <View style={styles.eqMetaItem}>
                          <Ionicons name="arrow-down" size={11} color={colors.textMuted} />
                          <Text style={[styles.eqMetaText, { color: colors.textMuted }]}>{eq.depth.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.eqMetaItem}>
                          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                          <Text style={[styles.eqMetaText, { color: colors.textMuted }]}>{formatDate(eq.startTime, 'relative')}</Text>
                        </View>
                        {distText && (
                          <View style={styles.eqMetaItem}>
                            <Ionicons name="navigate-outline" size={11} color={colors.textMuted} />
                            <Text style={[styles.eqMetaText, { color: colors.textMuted }]}>{distText}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[styles.severityPill, { backgroundColor: magColor + '18' }]}>
                      <Text style={[styles.severityPillText, { color: magColor }]}>{getMagnitudeLabel(eq.mag)}</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </View>
                  {isExpanded && (
                    <View style={[styles.eqExpanded, { borderTopColor: colors.border }]}>
                      <View style={styles.eqDetailGrid}>
                        <View style={[styles.eqDetailItem, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                          <Ionicons name="compass-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Latitude</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>{eq.coordinates.latitude.toFixed(4)}</Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                          <Ionicons name="compass-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Longitude</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>{eq.coordinates.longitude.toFixed(4)}</Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                          <Ionicons name="swap-vertical-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Depth</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>{eq.depth.toFixed(1)} km</Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                          <Ionicons name="radio-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Source</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>{eq.source}</Text>
                        </View>
                      </View>
                      {eq.message ? <Text style={[styles.eqDescription, { color: colors.textSecondary }]}>{eq.message}</Text> : null}
                      <Text style={[styles.eqTimestamp, { color: colors.textMuted }]}>Occurred: {formatDate(eq.startTime, 'long')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 30 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroMaxMag: {
    fontSize: 52,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 58,
  },
  heroMaxLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mapSection: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mapLabel: { fontSize: 13, fontWeight: '500' },
  mapDots: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapDot: { position: 'absolute', opacity: 0.85 },
  mapStats: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mapStatsText: { fontSize: 12, fontWeight: '600' },
  filterSection: { marginBottom: 20 },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  filterScroll: { gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  filterCountText: { fontSize: 10, fontWeight: '700' },
  listSection: { marginTop: 4 },
  listTitle: { fontSize: 20, fontWeight: '700', marginBottom: 14 },
  eqCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  eqRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  magBadge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  magValue: { fontSize: 18, fontWeight: '800' },
  magLabel: { fontSize: 8, fontWeight: '700', marginTop: 1 },
  eqInfo: { flex: 1 },
  eqLocation: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  eqMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eqMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eqMetaText: { fontSize: 11 },
  severityPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityPillText: { fontSize: 10, fontWeight: '700' },
  eqExpanded: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  eqDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eqDetailItem: { width: '48%', padding: 10, borderRadius: 14, gap: 4 },
  eqDetailLabel: { fontSize: 10, fontWeight: '500' },
  eqDetailValue: { fontSize: 14, fontWeight: '600' },
  eqDescription: { fontSize: 13, lineHeight: 20 },
  eqTimestamp: { fontSize: 11 },
});
