import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
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
import { formatDate, getSeverityColor } from '@/utils/helpers';

interface RiverLevel {
  id: string;
  name: string;
  currentLevel: number;
  warningLevel: number;
  dangerLevel: number;
  status: 'normal' | 'warning' | 'danger';
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: number;
}

interface FloodAlert extends Alert {
  alertLevel: string;
  affectedArea: number;
}

interface EvacuationRoute {
  id: string;
  name: string;
  direction: string;
  distance: number;
  status: 'open' | 'congested' | 'closed';
}

const MOCK_RIVER_LEVELS: RiverLevel[] = [
  { id: 'r1', name: 'Brahmaputra River', currentLevel: 12.4, warningLevel: 15.0, dangerLevel: 18.5, status: 'warning', trend: 'rising', lastUpdated: Date.now() - 1800000 },
  { id: 'r2', name: 'Ganges River', currentLevel: 8.2, warningLevel: 12.0, dangerLevel: 15.0, status: 'normal', trend: 'stable', lastUpdated: Date.now() - 3600000 },
  { id: 'r3', name: 'Yamuna River', currentLevel: 14.8, warningLevel: 14.5, dangerLevel: 17.0, status: 'danger', trend: 'rising', lastUpdated: Date.now() - 900000 },
  { id: 'r4', name: 'Godavari River', currentLevel: 6.1, warningLevel: 10.0, dangerLevel: 13.0, status: 'normal', trend: 'falling', lastUpdated: Date.now() - 7200000 },
  { id: 'r5', name: 'Kosi River', currentLevel: 11.3, warningLevel: 12.5, dangerLevel: 16.0, status: 'warning', trend: 'rising', lastUpdated: Date.now() - 600000 },
];

const MOCK_EVACUATION_ROUTES: EvacuationRoute[] = [
  { id: 'e1', name: 'NH-44 → Highland Shelter', direction: 'North', distance: 8.2, status: 'open' },
  { id: 'e2', name: 'District Road → Relief Camp', direction: 'East', distance: 4.5, status: 'congested' },
  { id: 'e3', name: 'Ring Road → Safe Zone B', direction: 'West', distance: 12.1, status: 'open' },
  { id: 'e4', name: 'Bridge Route → City Center', direction: 'South', distance: 6.7, status: 'closed' },
];

const AFFECTED_DISTRICTS = [
  'Kamrup Metropolitan', 'Nagaon', 'Morigaon', 'Jorhat', 'Sivasagar',
  'Dhemaji', 'Lakhimpur', 'Dibrugarh', 'Tinsukia',
];

function getStatusColor(status: string): string {
  switch (status) {
    case 'danger': return '#DC2626';
    case 'warning': return '#F59E0B';
    default: return '#16A34A';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'danger': return 'DANGER';
    case 'warning': return 'WARNING';
    default: return 'NORMAL';
  }
}

function getRouteStatusColor(status: string): string {
  switch (status) {
    case 'closed': return '#DC2626';
    case 'congested': return '#F59E0B';
    default: return '#16A34A';
  }
}

export default function FloodMonitorScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { location } = useLocation();

  const [floodAlerts, setFloodAlerts] = useState<FloodAlert[]>([]);
  const [riverLevels] = useState<RiverLevel[]>(MOCK_RIVER_LEVELS);
  const [evacuationRoutes] = useState<EvacuationRoute[]>(MOCK_EVACUATION_ROUTES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFloodData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fetchFloodData: fetchFD } = await import('@/services/disasterService');
      const alerts = await fetchFD(location ?? undefined);
      const enriched: FloodAlert[] = alerts.map((a) => ({
        ...a,
        alertLevel: (a as any).alertLevel ?? 'moderate',
        affectedArea: (a as any).affectedArea ?? 0,
      }));
      setFloodAlerts(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flood data');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchFloodData();
  }, [fetchFloodData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFloodData();
    setRefreshing(false);
  }, [fetchFloodData]);

  const floodProbability = useMemo(() => {
    const warningCount = riverLevels.filter((r) => r.status !== 'normal').length;
    return Math.min(100, Math.round((warningCount / riverLevels.length) * 100 + floodAlerts.length * 8));
  }, [riverLevels, floodAlerts]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flood Monitor</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            River levels & flood alerts
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
            <Ionicons name="water-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.mapLabel, { color: colors.textMuted }]}>Flood Coverage Map</Text>
          </View>
          <View style={styles.mapOverlay}>
            {riverLevels.map((river, i) => {
              const x = 30 + (i % 3) * 80;
              const y = 20 + Math.floor(i / 3) * 50;
              return (
                <View
                  key={river.id}
                  style={[
                    styles.riverDot,
                    {
                      left: x,
                      top: y,
                      backgroundColor: getStatusColor(river.status),
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={[styles.mapLegend, { backgroundColor: colors.surface }]}>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.legendDotLabel, { color: colors.textMuted }]}>Normal</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendDotLabel, { color: colors.textMuted }]}>Warning</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#DC2626' }]} />
              <Text style={[styles.legendDotLabel, { color: colors.textMuted }]}>Danger</Text>
            </View>
          </View>
        </View>

        <View style={styles.probabilitySection}>
          <View style={[styles.probCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.probHeader}>
              <Ionicons name="analytics-outline" size={22} color={colors.primary} />
              <Text style={[styles.probTitle, { color: colors.text }]}>Flood Probability</Text>
            </View>
            <View style={styles.gaugeContainer}>
              <View style={[styles.gaugeTrack, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.gaugeFill,
                    {
                      width: `${floodProbability}%`,
                      backgroundColor:
                        floodProbability > 70 ? '#DC2626' : floodProbability > 40 ? '#F59E0B' : '#16A34A',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.gaugeValue,
                  {
                    color:
                      floodProbability > 70 ? '#DC2626' : floodProbability > 40 ? '#F59E0B' : '#16A34A',
                  },
                ]}
              >
                {floodProbability}%
              </Text>
            </View>
            <Text style={[styles.probSubtext, { color: colors.textSecondary }]}>
              {floodProbability > 70
                ? 'High risk - prepare for possible flooding'
                : floodProbability > 40
                ? 'Moderate risk - monitor river levels'
                : 'Low risk - conditions are favorable'}
            </Text>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching flood data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Data"
            description={error}
            actionText="Retry"
            onAction={fetchFloodData}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }}
          />
        ) : (
          <>
            <View style={styles.riverSection}>
              <SectionHeader
                title="River Levels"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {riverLevels.map((river) => {
                const levelPercent = Math.min(100, (river.currentLevel / river.dangerLevel) * 100);
                const statusColor = getStatusColor(river.status);
                const trendIcon = river.trend === 'rising' ? 'trending-up' : river.trend === 'falling' ? 'trending-down' : 'remove-outline';
                const trendColor = river.trend === 'rising' ? '#DC2626' : river.trend === 'falling' ? '#16A34A' : colors.textMuted;

                return (
                  <View
                    key={river.id}
                    style={[styles.riverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.riverCardHeader}>
                      <View style={styles.riverNameRow}>
                        <Ionicons name="water" size={18} color={statusColor} />
                        <Text style={[styles.riverName, { color: colors.text }]}>{river.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {getStatusLabel(river.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.levelBars}>
                      <View style={styles.levelRow}>
                        <Text style={[styles.levelLabel, { color: colors.textMuted }]}>Current</Text>
                        <Text style={[styles.levelValue, { color: colors.text }]}>
                          {river.currentLevel.toFixed(1)} m
                        </Text>
                      </View>
                      <View style={[styles.levelTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View
                          style={[
                            styles.levelFill,
                            { width: `${levelPercent}%`, backgroundColor: statusColor },
                          ]}
                        />
                        <View
                          style={[
                            styles.warningMarker,
                            { left: `${(river.warningLevel / river.dangerLevel) * 100}%` },
                          ]}
                        />
                      </View>
                      <View style={styles.levelLabels}>
                        <Text style={[styles.levelLimit, { color: colors.textMuted }]}>
                          Warning: {river.warningLevel}m
                        </Text>
                        <Text style={[styles.levelLimit, { color: '#DC2626' }]}>
                          Danger: {river.dangerLevel}m
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.riverFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.trendRow}>
                        <Ionicons name={trendIcon as any} size={14} color={trendColor} />
                        <Text style={[styles.trendText, { color: trendColor }]}>
                          {river.trend.charAt(0).toUpperCase() + river.trend.slice(1)}
                        </Text>
                      </View>
                      <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                        {formatDate(river.lastUpdated, 'relative')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {floodAlerts.length > 0 && (
              <View style={styles.alertsSection}>
                <SectionHeader
                  title="Flood Alerts"
                  colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
                />
                {floodAlerts.slice(0, 8).map((alert) => (
                  <View
                    key={alert.id}
                    style={[styles.floodAlertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.alertStripe, { backgroundColor: getSeverityColor(alert.severity) }]} />
                    <View style={styles.floodAlertContent}>
                      <Text style={[styles.floodAlertTitle, { color: colors.text }]} numberOfLines={1}>
                        {alert.title}
                      </Text>
                      <Text style={[styles.floodAlertDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {alert.message}
                      </Text>
                      <View style={styles.floodAlertMeta}>
                        <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                        <Text style={[styles.floodAlertMetaText, { color: colors.textMuted }]}>
                          {formatDate(alert.startTime, 'relative')}
                        </Text>
                        <Ionicons name="radio-outline" size={11} color={colors.textMuted} />
                        <Text style={[styles.floodAlertMetaText, { color: colors.textMuted }]}>
                          {alert.source}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.districtSection}>
              <SectionHeader
                title="Affected Districts"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              <View style={styles.districtGrid}>
                {AFFECTED_DISTRICTS.map((district) => (
                  <View
                    key={district}
                    style={[styles.districtChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  >
                    <Ionicons name="location" size={12} color={colors.warning} />
                    <Text style={[styles.districtText, { color: colors.textSecondary }]}>{district}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.evacSection}>
              <SectionHeader
                title="Evacuation Routes"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {evacuationRoutes.map((route) => {
                const statusColor = getRouteStatusColor(route.status);
                return (
                  <View
                    key={route.id}
                    style={[styles.evacCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.evacStatusStrip, { backgroundColor: statusColor }]} />
                    <View style={styles.evacContent}>
                      <View style={styles.evacHeader}>
                        <Ionicons name="git-merge-outline" size={18} color={colors.text} />
                        <Text style={[styles.evacName, { color: colors.text }]}>{route.name}</Text>
                      </View>
                      <View style={styles.evacMetaRow}>
                        <View style={styles.evacMetaItem}>
                          <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                          <Text style={[styles.evacMetaText, { color: colors.textMuted }]}>
                            {route.direction} · {route.distance} km
                          </Text>
                        </View>
                        <View style={[styles.evacStatusBadge, { backgroundColor: statusColor + '18' }]}>
                          <Text style={[styles.evacStatusText, { color: statusColor }]}>
                            {route.status.toUpperCase()}
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
  riverDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  mapLegend: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  mapLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDotSmall: { width: 8, height: 8, borderRadius: 4 },
  legendDotLabel: { fontSize: 10, fontWeight: '500' },
  probabilitySection: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  probCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  probHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  probTitle: { fontSize: FontSizes.lg, fontWeight: '700' },
  gaugeContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  gaugeTrack: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 6 },
  gaugeValue: { fontSize: FontSizes.xxl, fontWeight: '800', minWidth: 50, textAlign: 'right' },
  probSubtext: { fontSize: FontSizes.sm, marginTop: Spacing.sm },
  riverSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  riverCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  riverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  riverNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  riverName: { fontSize: FontSizes.md, fontWeight: '700', flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700' },
  levelBars: { paddingHorizontal: Spacing.md },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  levelLabel: { fontSize: FontSizes.xs, fontWeight: '500' },
  levelValue: { fontSize: FontSizes.md, fontWeight: '700' },
  levelTrack: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  levelFill: { height: '100%', borderRadius: 4 },
  warningMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: '#F59E0B',
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  levelLimit: { fontSize: 10, fontWeight: '500' },
  riverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: FontSizes.xs, fontWeight: '600' },
  lastUpdated: { fontSize: FontSizes.xs },
  alertsSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  floodAlertCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  alertStripe: { width: 4 },
  floodAlertContent: { flex: 1, padding: Spacing.md },
  floodAlertTitle: { fontSize: FontSizes.md, fontWeight: '700', marginBottom: 4 },
  floodAlertDesc: { fontSize: FontSizes.sm, lineHeight: 18, marginBottom: 6 },
  floodAlertMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  floodAlertMetaText: { fontSize: FontSizes.xs },
  districtSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  districtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  districtText: { fontSize: FontSizes.sm, fontWeight: '500' },
  evacSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  evacCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  evacStatusStrip: { width: 4 },
  evacContent: { flex: 1, padding: Spacing.md },
  evacHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  evacName: { fontSize: FontSizes.md, fontWeight: '700', flex: 1 },
  evacMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evacMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evacMetaText: { fontSize: FontSizes.sm },
  evacStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  evacStatusText: { fontSize: FontSizes.xs, fontWeight: '700' },
});
