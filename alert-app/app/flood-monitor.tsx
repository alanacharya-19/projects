import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
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

function getStatusColor(status: string): string {
  switch (status) { case 'danger': return '#DC2626'; case 'warning': return '#F59E0B'; default: return '#16A34A'; }
}
function getStatusLabel(status: string): string {
  switch (status) { case 'danger': return 'DANGER'; case 'warning': return 'WARNING'; default: return 'NORMAL'; }
}
function getRouteStatusColor(status: string): string {
  switch (status) { case 'closed': return '#DC2626'; case 'congested': return '#F59E0B'; default: return '#16A34A'; }
}

export default function FloodMonitorScreen() {
  const { colors, resolvedMode } = useTheme();
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
      const enriched: FloodAlert[] = alerts.map((a) => ({ ...a, alertLevel: (a as any).alertLevel ?? 'moderate', affectedArea: (a as any).affectedArea ?? 0 }));
      setFloodAlerts(enriched);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch flood data'); }
    finally { setIsLoading(false); }
  }, [location]);

  useEffect(() => { fetchFloodData(); }, [fetchFloodData]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchFloodData(); setRefreshing(false); }, [fetchFloodData]);

  const floodProbability = useMemo(() => {
    const warningCount = riverLevels.filter((r) => r.status !== 'normal').length;
    return Math.min(100, Math.round((warningCount / riverLevels.length) * 100 + floodAlerts.length * 8));
  }, [riverLevels, floodAlerts]);

  const probColor = floodProbability > 70 ? '#DC2626' : floodProbability > 40 ? '#F59E0B' : '#16A34A';
  const dangerCount = riverLevels.filter((r) => r.status === 'danger').length;
  const warningCount = riverLevels.filter((r) => r.status === 'warning').length;

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
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Flood Monitor</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>River levels & flood alerts</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Flood Probability Card */}
        <LinearGradient
          colors={resolvedMode === 'dark' ? Gradients.heroCardDark : Gradients.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="water" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="analytics-outline" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>PROBABILITY</Text>
            </View>
          </View>
          <Text style={styles.heroProbValue}>{floodProbability}%</Text>
          <Text style={styles.heroProbLabel}>
            {floodProbability > 70 ? 'High risk — prepare for possible flooding' : floodProbability > 40 ? 'Moderate risk — monitor river levels' : 'Low risk — conditions are favorable'}
          </Text>
          <View style={styles.heroGaugeTrack}>
            <View style={styles.heroGaugeBg}>
              <View style={[styles.heroGaugeFill, { width: `${floodProbability}%`, backgroundColor: probColor }]} />
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#FCA5A5' }]}>{dangerCount}</Text>
              <Text style={styles.heroStatLabel}>Danger</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#FCD34D' }]}>{warningCount}</Text>
              <Text style={styles.heroStatLabel}>Warning</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{riverLevels.length - dangerCount - warningCount}</Text>
              <Text style={styles.heroStatLabel}>Normal</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{floodAlerts.length}</Text>
              <Text style={styles.heroStatLabel}>Alerts</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Map */}
        <View style={[styles.mapSection, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="water-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.mapLabel, { color: colors.textMuted }]}>Flood Coverage Map</Text>
          </View>
          <View style={styles.mapOverlay}>
            {riverLevels.map((river, i) => (
              <View key={river.id} style={[styles.riverDot, { left: 30 + (i % 3) * 80, top: 20 + Math.floor(i / 3) * 50, backgroundColor: getStatusColor(river.status) }]} />
            ))}
          </View>
          <View style={[styles.mapLegend, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
            {[{ color: '#16A34A', label: 'Normal' }, { color: '#F59E0B', label: 'Warning' }, { color: '#DC2626', label: 'Danger' }].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching flood data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState icon="alert-circle-outline" title="Error Loading Data" description={error} actionText="Retry" onAction={fetchFloodData}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : (
          <>
            {/* River Levels */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>River Levels</Text>
            {riverLevels.map((river) => {
              const levelPercent = Math.min(100, (river.currentLevel / river.dangerLevel) * 100);
              const statusColor = getStatusColor(river.status);
              const trendIcon = river.trend === 'rising' ? 'trending-up' : river.trend === 'falling' ? 'trending-down' : 'remove-outline';
              const trendColor = river.trend === 'rising' ? '#DC2626' : river.trend === 'falling' ? '#16A34A' : colors.textMuted;
              return (
                <View key={river.id} style={[styles.riverCard, { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                  <View style={styles.riverHeader}>
                    <View style={styles.riverNameRow}>
                      <View style={[styles.riverIconWrap, { backgroundColor: statusColor + '15' }]}>
                        <Ionicons name="water" size={16} color={statusColor} />
                      </View>
                      <Text style={[styles.riverName, { color: colors.text }]}>{river.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(river.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.levelBars}>
                    <View style={styles.levelRow}>
                      <Text style={[styles.levelLabel, { color: colors.textMuted }]}>Current</Text>
                      <Text style={[styles.levelValue, { color: colors.text }]}>{river.currentLevel.toFixed(1)} m</Text>
                    </View>
                    <View style={[styles.levelTrack, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                      <View style={[styles.levelFill, { width: `${levelPercent}%`, backgroundColor: statusColor }]} />
                      <View style={[styles.warningMarker, { left: `${(river.warningLevel / river.dangerLevel) * 100}%` }]} />
                    </View>
                    <View style={styles.levelLabels}>
                      <Text style={[styles.levelLimit, { color: colors.textMuted }]}>Warning: {river.warningLevel}m</Text>
                      <Text style={[styles.levelLimit, { color: '#DC2626' }]}>Danger: {river.dangerLevel}m</Text>
                    </View>
                  </View>
                  <View style={[styles.riverFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.trendRow}>
                      <Ionicons name={trendIcon as any} size={14} color={trendColor} />
                      <Text style={[styles.trendText, { color: trendColor }]}>{river.trend.charAt(0).toUpperCase() + river.trend.slice(1)}</Text>
                    </View>
                    <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>{formatDate(river.lastUpdated, 'relative')}</Text>
                  </View>
                </View>
              );
            })}

            {/* Flood Alerts */}
            {floodAlerts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Flood Alerts</Text>
                {floodAlerts.slice(0, 8).map((alert) => (
                  <View key={alert.id} style={[styles.floodAlertCard, { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                    <View style={[styles.alertStripe, { backgroundColor: getSeverityColor(alert.severity) }]} />
                    <View style={styles.floodAlertContent}>
                      <Text style={[styles.floodAlertTitle, { color: colors.text }]} numberOfLines={1}>{alert.title}</Text>
                      <Text style={[styles.floodAlertDesc, { color: colors.textSecondary }]} numberOfLines={2}>{alert.message}</Text>
                      <View style={styles.floodAlertMeta}>
                        <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                        <Text style={[styles.floodAlertMetaText, { color: colors.textMuted }]}>{formatDate(alert.startTime, 'relative')}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Evacuation Routes */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Evacuation Routes</Text>
            {evacuationRoutes.map((route) => {
              const statusColor = getRouteStatusColor(route.status);
              return (
                <View key={route.id} style={[styles.evacCard, { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }]}>
                  <View style={[styles.evacStripe, { backgroundColor: statusColor }]} />
                  <View style={styles.evacContent}>
                    <View style={styles.evacHeader}>
                      <View style={[styles.evacIconWrap, { backgroundColor: statusColor + '15' }]}>
                        <Ionicons name="git-merge-outline" size={16} color={statusColor} />
                      </View>
                      <Text style={[styles.evacName, { color: colors.text }]}>{route.name}</Text>
                    </View>
                    <View style={styles.evacMetaRow}>
                      <View style={styles.evacMetaItem}>
                        <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.evacMetaText, { color: colors.textMuted }]}>{route.direction} · {route.distance} km</Text>
                      </View>
                      <View style={[styles.evacStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.evacStatusText, { color: statusColor }]}>{route.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
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
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  heroProbValue: {
    fontSize: 52,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 58,
  },
  heroProbLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  heroGaugeTrack: {
    marginBottom: 20,
  },
  heroGaugeBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroGaugeFill: {
    height: '100%',
    borderRadius: 4,
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
  mapSection: { height: 180, borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mapLabel: { fontSize: 13, fontWeight: '500' },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  riverDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  mapLegend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontWeight: '500' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 14 },
  riverCard: {
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
  riverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  riverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  riverIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riverName: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  levelBars: { paddingHorizontal: 14 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  levelLabel: { fontSize: 11, fontWeight: '500' },
  levelValue: { fontSize: 14, fontWeight: '700' },
  levelTrack: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  levelFill: { height: '100%', borderRadius: 4 },
  warningMarker: { position: 'absolute', top: -2, width: 2, height: 12, backgroundColor: '#F59E0B' },
  levelLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  levelLimit: { fontSize: 10, fontWeight: '500' },
  riverFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 11, fontWeight: '600' },
  lastUpdated: { fontSize: 11 },
  floodAlertCard: {
    flexDirection: 'row',
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
  alertStripe: { width: 4 },
  floodAlertContent: { flex: 1, padding: 14 },
  floodAlertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  floodAlertDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  floodAlertMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  floodAlertMetaText: { fontSize: 11 },
  evacCard: {
    flexDirection: 'row',
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
  evacStripe: { width: 4 },
  evacContent: { flex: 1, padding: 14 },
  evacHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  evacIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evacName: { fontSize: 14, fontWeight: '700', flex: 1 },
  evacMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evacMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evacMetaText: { fontSize: 13 },
  evacStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  evacStatusText: { fontSize: 10, fontWeight: '700' },
});
