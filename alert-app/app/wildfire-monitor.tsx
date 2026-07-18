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
import type { Alert } from '@/types';
import { formatDate, formatDistance } from '@/utils/helpers';
import { calculateDistance } from '@/services/locationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WildfireEntry extends Alert {
  brightness: number;
  confidence: string;
  frp: number;
  satellite: string;
  acquisitionDate: string;
  distance?: number;
}

interface SmokeZone {
  id: string;
  area: string;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  windDirection: string;
}

interface VillageAtRisk {
  id: string;
  name: string;
  distance: number;
  population: number;
  status: 'evacuation_advisory' | 'evacuation_order' | 'monitoring';
}

const MOCK_SMOKE_ZONES: SmokeZone[] = [
  { id: 's1', area: 'Northern Ridge Valley', intensity: 'very_high', windDirection: 'NE' },
  { id: 's2', area: 'Pine Forest District', intensity: 'high', windDirection: 'E' },
  { id: 's3', area: 'Cedar Hollow Basin', intensity: 'moderate', windDirection: 'SE' },
  { id: 's4', area: 'Eastwood Hills', intensity: 'low', windDirection: 'S' },
];

const MOCK_VILLAGES: VillageAtRisk[] = [
  { id: 'v1', name: 'Ridgeview', distance: 3.2, population: 1200, status: 'evacuation_order' },
  { id: 'v2', name: 'Pinecrest', distance: 5.8, population: 850, status: 'evacuation_advisory' },
  { id: 'v3', name: 'Cedarville', distance: 8.1, population: 2100, status: 'evacuation_advisory' },
  { id: 'v4', name: 'Hilltop Estates', distance: 11.4, population: 620, status: 'monitoring' },
  { id: 'v5', name: 'Valley Springs', distance: 14.7, population: 3400, status: 'monitoring' },
];

function getConfidenceColor(confidence: string): string {
  switch (confidence?.toLowerCase()) {
    case 'high': return '#DC2626';
    case 'nominal': return '#F97316';
    case 'low': return '#F59E0B';
    default: return '#6B7280';
  }
}

function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'very_high': return '#DC2626';
    case 'high': return '#F97316';
    case 'moderate': return '#F59E0B';
    default: return '#16A34A';
  }
}

function getVillageStatusColor(status: string): string {
  switch (status) {
    case 'evacuation_order': return '#DC2626';
    case 'evacuation_advisory': return '#F59E0B';
    default: return '#16A34A';
  }
}

function getVillageStatusLabel(status: string): string {
  switch (status) {
    case 'evacuation_order': return 'EVACUATION ORDER';
    case 'evacuation_advisory': return 'EVACUATION ADVISORY';
    default: return 'MONITORING';
  }
}

export default function WildfireMonitorScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { location } = useLocation();

  const [fires, setFires] = useState<WildfireEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFires = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fetchWildfires: fetchWF } = await import('@/services/disasterService');
      const alerts = await fetchWF(
        location
          ? {
              minLat: location.latitude - 5,
              minLon: location.longitude - 5,
              maxLat: location.latitude + 5,
              maxLon: location.longitude + 5,
            }
          : undefined
      );

      const entries: WildfireEntry[] = alerts.map((a) => {
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
          brightness: (a as any).brightness ?? 0,
          confidence: (a as any).confidence ?? 'unknown',
          frp: (a as any).frp ?? 0,
          satellite: (a as any).satellite ?? 'Unknown',
          acquisitionDate: (a as any).acquisitionDate ?? '',
          distance: dist,
        };
      });

      entries.sort((a, b) => b.brightness - a.brightness);
      setFires(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wildfire data');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchFires();
  }, [fetchFires]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFires();
    setRefreshing(false);
  }, [fetchFires]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const maxBrightness = useMemo(
    () => Math.max(...fires.map((f) => f.brightness), 1),
    [fires]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Wildfire Monitor</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {fires.length} active fire{fires.length !== 1 ? 's' : ''} detected
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
            <Ionicons name="flame-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.mapLabel, { color: colors.textMuted }]}>Fire Hotspot Map</Text>
          </View>
          <View style={styles.mapOverlay}>
            {fires.slice(0, 25).map((fire) => {
              const offsetX = ((fire.coordinates.longitude % 8) / 8) * (SCREEN_WIDTH - 80);
              const offsetY = ((fire.coordinates.latitude % 4) / 4) * 140;
              const size = Math.max(6, (fire.brightness / maxBrightness) * 20);
              return (
                <View
                  key={fire.id}
                  style={[
                    styles.fireDot,
                    {
                      left: 15 + Math.abs(offsetX),
                      top: 10 + Math.abs(offsetY),
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor:
                        fire.brightness > 450 ? '#DC2626' : fire.brightness > 350 ? '#F97316' : '#F59E0B',
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={[styles.mapStatsBar, { backgroundColor: colors.surface }]}>
            <Text style={[styles.mapStatsText, { color: colors.text }]}>
              {fires.length} hotspots · {fires.filter((f) => f.brightness > 450).length} high intensity
            </Text>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching wildfire data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Data"
            description={error}
            actionText="Retry"
            onAction={fetchFires}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }}
          />
        ) : fires.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No Active Fires"
            description="No wildfires detected in your monitored area"
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }}
          />
        ) : (
          <>
            <View style={styles.fireListSection}>
              <SectionHeader
                title="Active Fires"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {fires.slice(0, 20).map((fire) => {
                const isExpanded = expandedId === fire.id;
                const distText = fire.distance != null ? formatDistance(fire.distance) : null;
                const confColor = getConfidenceColor(fire.confidence);
                const brightnessPercent = Math.min(100, (fire.brightness / 500) * 100);
                const brightnessColor =
                  fire.brightness > 450 ? '#DC2626' : fire.brightness > 350 ? '#F97316' : '#F59E0B';

                return (
                  <TouchableOpacity
                    key={fire.id}
                    style={[styles.fireCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => toggleExpand(fire.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fireCardMain}>
                      <View style={[styles.fireIconWrap, { backgroundColor: brightnessColor + '15' }]}>
                        <Ionicons name="flame" size={22} color={brightnessColor} />
                      </View>
                      <View style={styles.fireInfo}>
                        <Text style={[styles.fireTitle, { color: colors.text }]} numberOfLines={1}>
                          {fire.title}
                        </Text>
                        <View style={styles.fireMetaRow}>
                          {distText && (
                            <View style={styles.fireMetaItem}>
                              <Ionicons name="navigate-outline" size={11} color={colors.textMuted} />
                              <Text style={[styles.fireMetaText, { color: colors.textMuted }]}>{distText}</Text>
                            </View>
                          )}
                          <View style={styles.fireMetaItem}>
                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                            <Text style={[styles.fireMetaText, { color: colors.textMuted }]}>
                              {formatDate(fire.startTime, 'relative')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </View>

                    <View style={styles.fireQuickStats}>
                      <View style={styles.quickStat}>
                        <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Brightness</Text>
                        <View style={[styles.miniGauge, { backgroundColor: colors.surfaceVariant }]}>
                          <View
                            style={[
                              styles.miniGaugeFill,
                              { width: `${brightnessPercent}%`, backgroundColor: brightnessColor },
                            ]}
                          />
                        </View>
                        <Text style={[styles.quickStatValue, { color: brightnessColor }]}>
                          {fire.brightness.toFixed(0)}K
                        </Text>
                      </View>
                      <View style={[styles.quickStatBadge, { backgroundColor: confColor + '18' }]}>
                        <Text style={[styles.quickStatBadgeText, { color: confColor }]}>
                          {fire.confidence}
                        </Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={[styles.fireExpanded, { borderTopColor: colors.border }]}>
                        <View style={styles.detailGrid}>
                          <View style={[styles.detailItem, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name="thermometer-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Brightness</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {fire.brightness.toFixed(0)}K
                            </Text>
                          </View>
                          <View style={[styles.detailItem, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name="flash-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>FRP</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {fire.frp.toFixed(1)} MW
                            </Text>
                          </View>
                          <View style={[styles.detailItem, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Satellite</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{fire.satellite}</Text>
                          </View>
                          <View style={[styles.detailItem, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name="compass-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Coordinates</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {fire.coordinates.latitude.toFixed(3)}, {fire.coordinates.longitude.toFixed(3)}
                            </Text>
                          </View>
                        </View>

                        {fire.message ? (
                          <Text style={[styles.fireDescription, { color: colors.textSecondary }]}>
                            {fire.message}
                          </Text>
                        ) : null}

                        <View style={[styles.windIndicator, { backgroundColor: colors.surfaceVariant }]}>
                          <Ionicons name="compass" size={20} color={colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.windTitle, { color: colors.text }]}>Spread Risk</Text>
                            <Text style={[styles.windText, { color: colors.textSecondary }]}>
                              Wind pattern may carry smoke to nearby areas
                            </Text>
                          </View>
                          <Ionicons name="warning-outline" size={16} color={colors.warning} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.smokeSection}>
              <SectionHeader
                title="Smoke Intensity"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {MOCK_SMOKE_ZONES.map((zone) => {
                const intColor = getIntensityColor(zone.intensity);
                const intPercent =
                  zone.intensity === 'very_high' ? 100 : zone.intensity === 'high' ? 75 : zone.intensity === 'moderate' ? 50 : 25;
                return (
                  <View
                    key={zone.id}
                    style={[styles.smokeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.smokeHeader}>
                      <Ionicons name="cloudy" size={18} color={intColor} />
                      <Text style={[styles.smokeArea, { color: colors.text }]}>{zone.area}</Text>
                      <View style={[styles.intensityBadge, { backgroundColor: intColor + '18' }]}>
                        <Text style={[styles.intensityText, { color: intColor }]}>
                          {zone.intensity.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.smokeGauge, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.smokeGaugeFill,
                          { width: `${intPercent}%`, backgroundColor: intColor },
                        ]}
                      />
                    </View>
                    <View style={styles.smokeFooter}>
                      <View style={styles.windDirRow}>
                        <Ionicons name="navigate" size={12} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
                        <Text style={[styles.windDirText, { color: colors.textMuted }]}>
                          Wind: {zone.windDirection}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.villageSection}>
              <SectionHeader
                title="Nearby Villages at Risk"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {MOCK_VILLAGES.map((village) => {
                const statusColor = getVillageStatusColor(village.status);
                return (
                  <View
                    key={village.id}
                    style={[styles.villageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.villageStripe, { backgroundColor: statusColor }]} />
                    <View style={styles.villageContent}>
                      <View style={styles.villageHeader}>
                        <Ionicons name="business-outline" size={18} color={colors.text} />
                        <Text style={[styles.villageName, { color: colors.text }]}>{village.name}</Text>
                        <View style={[styles.villageStatusBadge, { backgroundColor: statusColor + '18' }]}>
                          <Text style={[styles.villageStatusText, { color: statusColor }]}>
                            {getVillageStatusLabel(village.status)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.villageMetaRow}>
                        <View style={styles.villageMetaItem}>
                          <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                          <Text style={[styles.villageMetaText, { color: colors.textMuted }]}>
                            {village.distance} km away
                          </Text>
                        </View>
                        <View style={styles.villageMetaItem}>
                          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                          <Text style={[styles.villageMetaText, { color: colors.textMuted }]}>
                            Pop. {village.population.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
    height: 180,
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
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fireDot: { position: 'absolute', opacity: 0.85 },
  mapStatsBar: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  mapStatsText: { fontSize: FontSizes.xs, fontWeight: '600' },
  fireListSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  fireCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  fireCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fireIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireInfo: { flex: 1 },
  fireTitle: { fontSize: FontSizes.md, fontWeight: '700', marginBottom: 4 },
  fireMetaRow: { flexDirection: 'row', gap: Spacing.md },
  fireMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fireMetaText: { fontSize: FontSizes.xs },
  fireQuickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quickStatLabel: { fontSize: FontSizes.xs, fontWeight: '500' },
  miniGauge: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  miniGaugeFill: { height: '100%', borderRadius: 2 },
  quickStatValue: { fontSize: FontSizes.xs, fontWeight: '700', minWidth: 40 },
  quickStatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  quickStatBadgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
  fireExpanded: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  detailItem: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  detailLabel: { fontSize: FontSizes.xs, fontWeight: '500' },
  detailValue: { fontSize: FontSizes.md, fontWeight: '600' },
  fireDescription: { fontSize: FontSizes.sm, lineHeight: 20 },
  windIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  windTitle: { fontSize: FontSizes.sm, fontWeight: '700' },
  windText: { fontSize: FontSizes.xs, color: '#94A3B8', marginTop: 2 },
  smokeSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  smokeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  smokeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  smokeArea: { fontSize: FontSizes.md, fontWeight: '700', flex: 1 },
  intensityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  intensityText: { fontSize: FontSizes.xs, fontWeight: '700' },
  smokeGauge: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.sm },
  smokeGaugeFill: { height: '100%', borderRadius: 3 },
  smokeFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  windDirRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  windDirText: { fontSize: FontSizes.xs, fontWeight: '500' },
  villageSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  villageCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  villageStripe: { width: 4 },
  villageContent: { flex: 1, padding: Spacing.md },
  villageHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  villageName: { fontSize: FontSizes.md, fontWeight: '700', flex: 1 },
  villageStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  villageStatusText: { fontSize: FontSizes.xs, fontWeight: '700' },
  villageMetaRow: { flexDirection: 'row', gap: Spacing.lg },
  villageMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  villageMetaText: { fontSize: FontSizes.sm },
});
