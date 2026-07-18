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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from '@/hooks/useLocation';
import SectionHeader from '@/components/SectionHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
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
  const { colors } = useTheme();
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
          ? {
              minLat: location.latitude - 5,
              minLon: location.longitude - 5,
              maxLat: location.latitude + 5,
              maxLon: location.longitude + 5,
            }
          : undefined
      );

      const entries: EarthquakeEntry[] = alerts.map((a) => {
        const meta: any = (a as any).metadata ?? {};
        const dist = location
          ? calculateDistance(
              location.latitude,
              location.longitude,
              a.coordinates.latitude,
              a.coordinates.longitude
            )
          : undefined;
        return {
          ...a,
          mag: meta.magnitude ?? 0,
          depth: meta.depth ?? 0,
          locationName: meta.locationName ?? a.title,
          distance: dist,
        };
      });

      entries.sort((a, b) => b.startTime - a.startTime);
      setEarthquakes(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earthquakes');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchEarthquakes();
  }, [fetchEarthquakes]);

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

  const maxMag = useMemo(
    () => Math.max(...earthquakes.map((e) => e.mag), 0),
    [earthquakes]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Earthquake Monitor</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {earthquakes.length} event{earthquakes.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.mapSection, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="globe-outline" size={48} color={colors.textMuted} />
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
          <View style={[styles.mapStats, { backgroundColor: colors.surface }]}>
            <Text style={[styles.mapStatsText, { color: colors.text }]}>
              Max: M{maxMag.toFixed(1)} · {filteredEarthquakes.length} shown
            </Text>
          </View>
        </View>

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
                      backgroundColor: isActive ? f.color + '18' : colors.surfaceVariant,
                      borderColor: isActive ? f.color : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.filterDot, { backgroundColor: f.color }]} />
                  <Text style={[styles.filterChipText, { color: isActive ? f.color : colors.textMuted }]}>
                    {f.label}
                  </Text>
                  <View style={[styles.filterCount, { backgroundColor: isActive ? f.color + '20' : colors.surface }]}>
                    <Text style={[styles.filterCountText, { color: isActive ? f.color : colors.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching earthquake data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Data"
            description={error}
            actionText="Retry"
            onAction={fetchEarthquakes}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }}
          />
        ) : filteredEarthquakes.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No Earthquakes Found"
            description="No earthquakes match the selected magnitude filter"
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }}
          />
        ) : (
          <View style={styles.listSection}>
            <SectionHeader
              title="Latest Earthquakes"
              colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
            />
            {filteredEarthquakes.map((eq) => {
              const isExpanded = expandedId === eq.id;
              const magColor = getMagnitudeColor(eq.mag);
              const distText = eq.distance != null ? formatDistance(eq.distance) : null;

              return (
                <TouchableOpacity
                  key={eq.id}
                  style={[
                    styles.eqCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => toggleExpand(eq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eqRow}>
                    <View style={[styles.magBadge, { backgroundColor: magColor + '15' }]}>
                      <Text style={[styles.magValue, { color: magColor }]}>
                        {eq.mag.toFixed(1)}
                      </Text>
                      <Text style={[styles.magLabel, { color: magColor }]}>MAG</Text>
                    </View>
                    <View style={styles.eqInfo}>
                      <Text style={[styles.eqLocation, { color: colors.text }]} numberOfLines={1}>
                        {eq.locationName}
                      </Text>
                      <View style={styles.eqMetaRow}>
                        <View style={styles.eqMetaItem}>
                          <Ionicons name="arrow-down" size={11} color={colors.textMuted} />
                          <Text style={[styles.eqMetaText, { color: colors.textMuted }]}>
                            {eq.depth.toFixed(1)} km
                          </Text>
                        </View>
                        <View style={styles.eqMetaItem}>
                          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                          <Text style={[styles.eqMetaText, { color: colors.textMuted }]}>
                            {formatDate(eq.startTime, 'relative')}
                          </Text>
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
                      <Text style={[styles.severityPillText, { color: magColor }]}>
                        {getMagnitudeLabel(eq.mag)}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>

                  {isExpanded && (
                    <View style={[styles.eqExpanded, { borderTopColor: colors.border }]}>
                      <View style={styles.eqDetailGrid}>
                        <View style={[styles.eqDetailItem, { backgroundColor: colors.surfaceVariant }]}>
                          <Ionicons name="compass-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Latitude</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>
                            {eq.coordinates.latitude.toFixed(4)}
                          </Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: colors.surfaceVariant }]}>
                          <Ionicons name="compass-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Longitude</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>
                            {eq.coordinates.longitude.toFixed(4)}
                          </Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: colors.surfaceVariant }]}>
                          <Ionicons name="swap-vertical-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Depth</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>
                            {eq.depth.toFixed(1)} km
                          </Text>
                        </View>
                        <View style={[styles.eqDetailItem, { backgroundColor: colors.surfaceVariant }]}>
                          <Ionicons name="radio-outline" size={16} color={colors.textMuted} />
                          <Text style={[styles.eqDetailLabel, { color: colors.textMuted }]}>Source</Text>
                          <Text style={[styles.eqDetailValue, { color: colors.text }]}>{eq.source}</Text>
                        </View>
                      </View>
                      {eq.message ? (
                        <Text style={[styles.eqDescription, { color: colors.textSecondary }]}>
                          {eq.message}
                        </Text>
                      ) : null}
                      <Text style={[styles.eqTimestamp, { color: colors.textMuted }]}>
                        Occurred: {formatDate(eq.startTime, 'long')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: Spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '700' },
  headerSubtitle: { fontSize: FontSizes.xs, marginTop: 2 },
  refreshBtn: { padding: Spacing.xs },
  scrollContent: { paddingBottom: 40 },
  mapSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    height: 200,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  mapLabel: { fontSize: FontSizes.sm, fontWeight: '500' },
  mapDots: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapDot: { position: 'absolute', opacity: 0.85 },
  mapStats: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  mapStatsText: { fontSize: FontSizes.xs, fontWeight: '600' },
  filterSection: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  filterLabel: { fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  filterScroll: { gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: FontSizes.sm, fontWeight: '600' },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  filterCountText: { fontSize: FontSizes.xs, fontWeight: '700' },
  listSection: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  eqCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  eqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  magBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magValue: { fontSize: FontSizes.xl, fontWeight: '800' },
  magLabel: { fontSize: 8, fontWeight: '700', marginTop: 1 },
  eqInfo: { flex: 1 },
  eqLocation: { fontSize: FontSizes.md, fontWeight: '600', marginBottom: 4 },
  eqMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  eqMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eqMetaText: { fontSize: FontSizes.xs },
  severityPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  severityPillText: { fontSize: FontSizes.xs, fontWeight: '700' },
  eqExpanded: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  eqDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  eqDetailItem: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  eqDetailLabel: { fontSize: FontSizes.xs, fontWeight: '500' },
  eqDetailValue: { fontSize: FontSizes.md, fontWeight: '600' },
  eqDescription: { fontSize: FontSizes.sm, lineHeight: 20 },
  eqTimestamp: { fontSize: FontSizes.xs },
});
