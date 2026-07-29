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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from '@/hooks/useLocation';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import GradientBackground from '@/components/GradientBackground';
import { Gradients, Shadows } from '@/constants/theme';
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
  switch (confidence?.toLowerCase()) { case 'high': return '#DC2626'; case 'nominal': return '#F97316'; case 'low': return '#F59E0B'; default: return '#6B7280'; }
}
function getIntensityColor(intensity: string): string {
  switch (intensity) { case 'very_high': return '#DC2626'; case 'high': return '#F97316'; case 'moderate': return '#F59E0B'; default: return '#16A34A'; }
}
function getVillageStatusColor(status: string): string {
  switch (status) { case 'evacuation_order': return '#DC2626'; case 'evacuation_advisory': return '#F59E0B'; default: return '#16A34A'; }
}
function getVillageStatusLabel(status: string): string {
  switch (status) { case 'evacuation_order': return 'EVACUATION ORDER'; case 'evacuation_advisory': return 'EVACUATION ADVISORY'; default: return 'MONITORING'; }
}

export default function WildfireMonitorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
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
        location ? { minLat: location.latitude - 5, minLon: location.longitude - 5, maxLat: location.latitude + 5, maxLon: location.longitude + 5 } : undefined
      );
      const entries: WildfireEntry[] = alerts.map((a) => {
        const dist = location ? calculateDistance(location.latitude, location.longitude, a.coordinates.latitude, a.coordinates.longitude) : undefined;
        return { ...a, brightness: (a as any).brightness ?? 0, confidence: (a as any).confidence ?? 'unknown', frp: (a as any).frp ?? 0, satellite: (a as any).satellite ?? 'Unknown', acquisitionDate: (a as any).acquisitionDate ?? '', distance: dist };
      });
      entries.sort((a, b) => b.brightness - a.brightness);
      setFires(entries);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch wildfire data'); }
    finally { setIsLoading(false); }
  }, [location]);

  useEffect(() => { fetchFires(); }, [fetchFires]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchFires(); setRefreshing(false); }, [fetchFires]);
  const toggleExpand = useCallback((id: string) => { setExpandedId((prev) => (prev === id ? null : id)); }, []);
  const maxBrightness = useMemo(() => Math.max(...fires.map((f) => f.brightness), 1), [fires]);

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? Gradients.alertDark : Gradients.alert}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Wildfire Monitor</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {fires.length} active fire{fires.length !== 1 ? 's' : ''} detected
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Map Card */}
        <LinearGradient
          colors={resolvedMode === 'dark' ? Gradients.heroCardDark : Gradients.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.mapPlaceholder}>
            <Ionicons name="flame-outline" size={48} color="rgba(255,255,255,0.6)" />
            <Text style={styles.mapLabel}>Fire Hotspot Map</Text>
          </View>
          <View style={styles.mapOverlay}>
            {fires.slice(0, 25).map((fire) => {
              const offsetX = ((fire.coordinates.longitude % 8) / 8) * (SCREEN_WIDTH - 80);
              const offsetY = ((fire.coordinates.latitude % 4) / 4) * 140;
              const size = Math.max(6, (fire.brightness / maxBrightness) * 20);
              return (
                <View key={fire.id} style={[styles.fireDot, {
                  left: 15 + Math.abs(offsetX), top: 10 + Math.abs(offsetY),
                  width: size, height: size, borderRadius: size / 2,
                  backgroundColor: fire.brightness > 450 ? '#FF6B6B' : fire.brightness > 350 ? '#FFB347' : '#FFDA77',
                }]} />
              );
            })}
          </View>
          <View style={styles.mapStatsBar}>
            <Text style={styles.mapStatsText}>
              {fires.length} hotspots · {fires.filter((f) => f.brightness > 450).length} high intensity
            </Text>
          </View>
        </LinearGradient>

        {isLoading && !refreshing ? (
          <LoadingSpinner message="Fetching wildfire data..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : error ? (
          <EmptyState icon="alert-circle-outline" title="Error Loading Data" description={error} actionText="Retry" onAction={fetchFires}
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : fires.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="No Active Fires" description="No wildfires detected in your monitored area"
            colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, accent: colors.primary }} />
        ) : (
          <>
            {/* Active Fires */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Fires</Text>
            {fires.slice(0, 20).map((fire) => {
              const isExpanded = expandedId === fire.id;
              const distText = fire.distance != null ? formatDistance(fire.distance) : null;
              const confColor = getConfidenceColor(fire.confidence);
              const brightnessPercent = Math.min(100, (fire.brightness / 500) * 100);
              const brightnessColor = fire.brightness > 450 ? '#DC2626' : fire.brightness > 350 ? '#F97316' : '#F59E0B';
              return (
                <TouchableOpacity key={fire.id} style={[styles.fireCard, { backgroundColor: colors.surface }]} onPress={() => toggleExpand(fire.id)} activeOpacity={0.7}>
                  <View style={styles.fireCardMain}>
                    <View style={[styles.fireIconWrap, { backgroundColor: brightnessColor + '15' }]}>
                      <Ionicons name="flame" size={20} color={brightnessColor} />
                    </View>
                    <View style={styles.fireInfo}>
                      <Text style={[styles.fireTitle, { color: colors.text }]} numberOfLines={1}>{fire.title}</Text>
                      <View style={styles.fireMetaRow}>
                        {distText && <View style={styles.fireMetaItem}><Ionicons name="navigate-outline" size={11} color={colors.textMuted} /><Text style={[styles.fireMetaText, { color: colors.textMuted }]}>{distText}</Text></View>}
                        <View style={styles.fireMetaItem}>
                          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                          <Text style={[styles.fireMetaText, { color: colors.textMuted }]}>{formatDate(fire.startTime, 'relative')}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </View>
                  <View style={styles.fireQuickStats}>
                    <View style={styles.quickStat}>
                      <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Brightness</Text>
                      <View style={[styles.miniGauge, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.miniGaugeFill, { width: `${brightnessPercent}%`, backgroundColor: brightnessColor }]} />
                      </View>
                      <Text style={[styles.quickStatValue, { color: brightnessColor }]}>{fire.brightness.toFixed(0)}K</Text>
                    </View>
                    <View style={[styles.quickStatBadge, { backgroundColor: confColor + '18' }]}>
                      <Text style={[styles.quickStatBadgeText, { color: confColor }]}>{fire.confidence}</Text>
                    </View>
                  </View>
                  {isExpanded && (
                    <View style={[styles.fireExpanded, { borderTopColor: colors.border }]}>
                      <View style={styles.detailGrid}>
                        {[{ icon: 'thermometer-outline', label: 'Brightness', value: `${fire.brightness.toFixed(0)}K` }, { icon: 'flash-outline', label: 'FRP', value: `${fire.frp.toFixed(1)} MW` }, { icon: 'globe-outline', label: 'Satellite', value: fire.satellite }, { icon: 'compass-outline', label: 'Coordinates', value: `${fire.coordinates.latitude.toFixed(3)}, ${fire.coordinates.longitude.toFixed(3)}` }].map((d) => (
                          <View key={d.label} style={[styles.detailItem, { backgroundColor: colors.surfaceVariant }]}>
                            <Ionicons name={d.icon as any} size={16} color={colors.textMuted} />
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{d.label}</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{d.value}</Text>
                          </View>
                        ))}
                      </View>
                      {fire.message ? <Text style={[styles.fireDescription, { color: colors.textSecondary }]}>{fire.message}</Text> : null}
                      <View style={[styles.windIndicator, { backgroundColor: colors.surfaceVariant }]}>
                        <Ionicons name="compass" size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.windTitle, { color: colors.text }]}>Spread Risk</Text>
                          <Text style={[styles.windText, { color: colors.textSecondary }]}>Wind pattern may carry smoke to nearby areas</Text>
                        </View>
                        <Ionicons name="warning-outline" size={16} color={colors.warning} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Smoke Intensity */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smoke Intensity</Text>
            {MOCK_SMOKE_ZONES.map((zone) => {
              const intColor = getIntensityColor(zone.intensity);
              const intPercent = zone.intensity === 'very_high' ? 100 : zone.intensity === 'high' ? 75 : zone.intensity === 'moderate' ? 50 : 25;
              return (
                <View key={zone.id} style={[styles.smokeCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.smokeHeader}>
                    <Ionicons name="cloudy" size={18} color={intColor} />
                    <Text style={[styles.smokeArea, { color: colors.text }]}>{zone.area}</Text>
                    <View style={[styles.intensityBadge, { backgroundColor: intColor + '18' }]}>
                      <Text style={[styles.intensityText, { color: intColor }]}>{zone.intensity.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={[styles.smokeGauge, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={[styles.smokeGaugeFill, { width: `${intPercent}%`, backgroundColor: intColor }]} />
                  </View>
                  <View style={styles.smokeFooter}>
                    <View style={styles.windDirRow}>
                      <Ionicons name="navigate" size={12} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
                      <Text style={[styles.windDirText, { color: colors.textMuted }]}>Wind: {zone.windDirection}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Villages at Risk */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Villages at Risk</Text>
            {MOCK_VILLAGES.map((village) => {
              const statusColor = getVillageStatusColor(village.status);
              return (
                <View key={village.id} style={[styles.villageCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.villageStripe, { backgroundColor: statusColor }]} />
                  <View style={styles.villageContent}>
                    <View style={styles.villageHeader}>
                      <Ionicons name="business-outline" size={18} color={colors.text} />
                      <Text style={[styles.villageName, { color: colors.text }]}>{village.name}</Text>
                      <View style={[styles.villageStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[styles.villageStatusText, { color: statusColor }]}>{getVillageStatusLabel(village.status)}</Text>
                      </View>
                    </View>
                    <View style={styles.villageMetaRow}>
                      <View style={styles.villageMetaItem}>
                        <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.villageMetaText, { color: colors.textMuted }]}>{village.distance} km away</Text>
                      </View>
                      <View style={styles.villageMetaItem}>
                        <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.villageMetaText, { color: colors.textMuted }]}>Pop. {village.population.toLocaleString()}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, fontWeight: '500' },
  heroCard: {
    borderRadius: 24,
    height: 200,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mapLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fireDot: { position: 'absolute', opacity: 0.9 },
  mapStatsBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Shadows.sm,
  },
  mapStatsText: { fontSize: 11, fontWeight: '700', color: '#0A1628' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 14 },
  fireCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  fireCardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  fireIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fireInfo: { flex: 1 },
  fireTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  fireMetaRow: { flexDirection: 'row', gap: 12 },
  fireMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fireMetaText: { fontSize: 11 },
  fireQuickStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  quickStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickStatLabel: { fontSize: 11, fontWeight: '500' },
  miniGauge: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  miniGaugeFill: { height: '100%', borderRadius: 2 },
  quickStatValue: { fontSize: 11, fontWeight: '700', minWidth: 40 },
  quickStatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  quickStatBadgeText: { fontSize: 10, fontWeight: '700' },
  fireExpanded: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem: { width: '48%', padding: 10, borderRadius: 14, gap: 4 },
  detailLabel: { fontSize: 10, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  fireDescription: { fontSize: 13, lineHeight: 20 },
  windIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16 },
  windTitle: { fontSize: 13, fontWeight: '700' },
  windText: { fontSize: 11, marginTop: 2 },
  smokeCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  smokeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  smokeArea: { fontSize: 14, fontWeight: '700', flex: 1 },
  intensityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  intensityText: { fontSize: 10, fontWeight: '700' },
  smokeGauge: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  smokeGaugeFill: { height: '100%', borderRadius: 3 },
  smokeFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  windDirRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  windDirText: { fontSize: 11, fontWeight: '500' },
  villageCard: {
    flexDirection: 'row',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  villageStripe: { width: 4 },
  villageContent: { flex: 1, padding: 14 },
  villageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  villageName: { fontSize: 14, fontWeight: '700', flex: 1 },
  villageStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  villageStatusText: { fontSize: 10, fontWeight: '700' },
  villageMetaRow: { flexDirection: 'row', gap: 16 },
  villageMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  villageMetaText: { fontSize: 13 },
});
