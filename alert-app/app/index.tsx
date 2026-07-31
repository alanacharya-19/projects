import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { useLocation } from '@/hooks/useLocation';
import { calculateDistance } from '@/services/locationService';
import { DISASTER_COLORS, Gradients } from '@/constants/theme';

import Sidebar from '@/components/Sidebar';
import NotificationPanel from '@/components/NotificationPanel';
import WeatherCard from '@/components/WeatherCard';

const SCREEN_H = Dimensions.get('window').height;

function getBannerImage(): number {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return require('../assets/banner/5am-8am.png');
  if (hour >= 8 && hour < 12) return require('../assets/banner/8am-12pm.jpg');
  if (hour >= 12 && hour < 16) return require('../assets/banner/12pm-4pm.jpg');
  if (hour >= 16 && hour < 18.5) return require('../assets/banner/4pm-6.30pm.jpg');
  if (hour >= 18.5 && hour < 22) return require('../assets/banner/6.30pm-10pm.jpg');
  return require('../assets/banner/10pm-5am.jpg');
}

function getAlertIconSource(type: string): ReturnType<typeof require> | null {
  const iconMap: Record<string, ReturnType<typeof require>> = {
    earthquake: require('../assets/icons/earthquake.png'),
    flood: require('../assets/icons/flood.png'),
    wildfire: require('../assets/icons/wildfire.png'),
    cyclone: require('../assets/icons/storms.png'),
    heatwave: require('../assets/icons/heatwaves.png'),
    tornado: require('../assets/icons/storms.png'),
  };
  return iconMap[type] || null;
}

function getRiskLevel(uv: number | null, aqi: number | null): { label: string; color: string } {
  if (uv === null || aqi === null) return { label: '--', color: '#94A3B8' };
  const uvRisk = uv >= 8 ? 4 : uv >= 6 ? 3 : uv >= 3 ? 2 : 1;
  const aqiRisk = aqi >= 5 ? 4 : aqi >= 4 ? 3 : aqi >= 3 ? 2 : 1;
  const maxRisk = Math.max(uvRisk, aqiRisk);
  const levels = [
    { label: 'Low', color: '#22C55E' },
    { label: 'Moderate', color: '#F97316' },
    { label: 'High', color: '#EF4444' },
    { label: 'Very High', color: '#7C3AED' },
  ];
  return levels[maxRisk - 1];
}

function getAQIDescription(aqi: number): { label: string; color: string } {
  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Good', color: '#22C55E' },
    2: { label: 'Fair', color: '#3B82F6' },
    3: { label: 'Moderate', color: '#F97316' },
    4: { label: 'Poor', color: '#EF4444' },
    5: { label: 'Very Poor', color: '#7C3AED' },
  };
  return map[aqi] || { label: 'Unknown', color: '#94A3B8' };
}

function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: '#22C55E' };
  if (uv <= 5) return { label: 'Moderate', color: '#F97316' };
  if (uv <= 7) return { label: 'High', color: '#EF4444' };
  return { label: 'Extreme', color: '#7C3AED' };
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'minor': return 'Low';
    case 'moderate': return 'Moderate';
    case 'severe': return 'High';
    case 'extreme': return 'Extreme';
    case 'emergency': return 'Emergency';
    default: return severity;
  }
}

function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
}

export default function HomeScreen() {
  const { state } = useAppContext();
  const { alerts } = useAlertContext();
  const { colors, resolvedMode } = useTheme();
  const { isLoading, refresh, airQuality, uvIndex } = useWeather();
  const { isLoading: locationLoading } = useLocation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notifPanelVisible, setNotifPanelVisible] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (notifPanelVisible) {
        setNotifPanelVisible(false);
        return true;
      }
      if (sidebarVisible) {
        setSidebarVisible(false);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [notifPanelVisible, sidebarVisible]);

  const weather = state.weather;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNavigate = useCallback((route: string) => {
    if (route === '/') return;
    router.push(route as any);
  }, [router]);

  if ((isLoading || locationLoading) && !weather && !state.location) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={resolvedMode === 'dark' ? Gradients.homeDark : Gradients.home} style={StyleSheet.absoluteFill} />

        <View style={styles.loadingCenter}>
          <Image source={require('../assets/appIcon.png')} style={styles.loadingAppIcon} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading weather data...</Text>
        </View>

        <Text style={[styles.loadingFromAlan, { color: colors.textMuted }]}>from alan</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={resolvedMode === 'dark' ? Gradients.homeDark : Gradients.home} style={StyleSheet.absoluteFill} />

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={handleNavigate} currentRoute="/" />
      <NotificationPanel visible={notifPanelVisible} onClose={() => setNotifPanelVisible(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <View style={styles.bannerWrap}>
          <Image source={getBannerImage()} style={styles.banner} resizeMode="stretch" />
          <View style={styles.bannerOverlay} />
          <LinearGradient
            colors={resolvedMode === 'dark'
              ? ['transparent', 'rgba(8,20,38,0.4)', 'rgba(8,20,38,0.8)', colors.background]
              : ['transparent', 'rgba(221,238,255,0.4)', 'rgba(248,251,255,0.8)', '#F7F9FC']}
            style={styles.bannerBlur}
          />

          <View style={[styles.navBar, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.navIcon} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.locationChip} activeOpacity={0.7}>
              <Ionicons name="location-sharp" size={12} color="#FFFFFF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {state.location?.city || 'Unknown'}{state.location?.country ? `, ${state.location.country}` : ''}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navIcon} onPress={() => setNotifPanelVisible(true)} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.greetingContainer, { top: insets.top + 48 }]}>
            <Text style={styles.greetingText}>
              {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 17 ? 'Good Afternoon,' : new Date().getHours() < 21 ? 'Good Evening,' : 'Good Night,'}
            </Text>
            <Text style={styles.userNameText}>User</Text>
            <Text style={styles.taglineText}>Stay safe, stay informed.</Text>

            <View style={styles.safeZoneCard}>
              <View style={styles.safeZoneIcon}>
                <Image source={require('../assets/icons/shield.png')} style={styles.safeZoneIconImg} />
              </View>
              <View style={styles.safeZoneTextWrap}>
                <Text style={styles.safeZoneText}>You are in</Text>
                <Text style={styles.safeZoneBold}>Safe Zone</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <WeatherCard weather={weather} />

        <View style={styles.contentPad}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            {[
              { source: require('../assets/icons/sos.png'), label: 'SOS', color: '#EF4444', route: '/emergency' },
              { source: require('../assets/icons/map.png'), label: 'Live Map', color: '#3B82F6', route: '/map' },
              { source: require('../assets/icons/weather.png'), label: 'Weather', color: '#F97316', route: '/forecast' },
              { source: require('../assets/icons/medicalServices.png'), label: 'Medical', color: '#3B82F6', route: '/nearby-services' },
              { source: require('../assets/icons/alerts.png'), label: 'Alerts', color: '#EF4444', route: '/alerts' },
              { source: require('../assets/icons/aiAssistant.png'), label: 'AI Assistant', color: '#8B5CF6', route: '/ai-chat' },
              { source: require('../assets/icons/globalFeed.png'), label: 'Global Feed', color: '#10B981', route: '/global-feed' },
              { source: require('../assets/icons/statistics.png'), label: 'Statistics', color: '#6366F1', route: '/statistics' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${item.color}15` }]}>
                  <Image source={item.source} style={styles.quickActionIconImg} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]} numberOfLines={2}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>More Insights</Text>
          </View>

          <View style={styles.insightsRow}>
            <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
              <View style={styles.insightHeader}>
                <Image source={require('../assets/icons/airQuality.png')} style={styles.insightIcon} />
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Air Quality</Text>
              </View>
              <View style={styles.insightBody}>
                <Text style={[styles.insightValue, { color: airQuality ? getAQIDescription(airQuality.aqi).color : colors.textMuted }]}>
                  {airQuality ? airQuality.aqi : '--'}
                </Text>
                <Text style={[styles.insightBadge, { backgroundColor: airQuality ? `${getAQIDescription(airQuality.aqi).color}20` : colors.surfaceVariant, color: airQuality ? getAQIDescription(airQuality.aqi).color : colors.textMuted }]}>
                  {airQuality ? getAQIDescription(airQuality.aqi).label : '--'}
                </Text>
              </View>
              <View style={[styles.insightFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.insightFooterValue, { color: colors.text }]}>{airQuality ? `${airQuality.pm2_5.toFixed(1)}` : '--'} µg</Text>
                <Text style={[styles.insightFooterLabel, { color: colors.textMuted }]}>PM2.5</Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
              <View style={styles.insightHeader}>
                <Image source={require('../assets/icons/uvIndex.png')} style={styles.insightIcon} />
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>UV Index</Text>
              </View>
              <View style={styles.insightBody}>
                <Text style={[styles.insightValue, { color: uvIndex !== null ? getUVLabel(uvIndex).color : colors.textMuted }]}>
                  {uvIndex !== null ? uvIndex.toFixed(1) : '--'}
                </Text>
                <Text style={[styles.insightBadge, { backgroundColor: uvIndex !== null ? `${getUVLabel(uvIndex).color}20` : colors.surfaceVariant, color: uvIndex !== null ? getUVLabel(uvIndex).color : colors.textMuted }]}>
                  {uvIndex !== null ? getUVLabel(uvIndex).label : '--'}
                </Text>
              </View>
              <View style={[styles.insightFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.insightFooterValue, { color: colors.text }]}>of 11+</Text>
                <Text style={[styles.insightFooterLabel, { color: colors.textMuted }]}>Scale</Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
              <View style={styles.insightHeader}>
                <Image source={require('../assets/icons/todayRisk.png')} style={styles.insightIcon} />
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Today&apos;s Risk</Text>
              </View>
              <View style={styles.insightBody}>
                <Text style={[styles.insightValue, { color: getRiskLevel(uvIndex, airQuality?.aqi ?? null).color, fontSize: 16 }]}>
                  {getRiskLevel(uvIndex, airQuality?.aqi ?? null).label}
                </Text>
                <Text style={[styles.insightBadge, { backgroundColor: `${getRiskLevel(uvIndex, airQuality?.aqi ?? null).color}20`, color: getRiskLevel(uvIndex, airQuality?.aqi ?? null).color }]}>
                  Daily
                </Text>
              </View>
              <View style={[styles.insightFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.insightFooterValue, { color: colors.text }]}>Overall</Text>
                <Text style={[styles.insightFooterLabel, { color: colors.textMuted }]}>Status</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Alerts</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/alerts')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.alertsRow}>
            {alerts.filter(a => !a.isDismissed).length === 0 ? (
              <View style={[styles.emptyAlertCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                <Text style={[styles.emptyAlertText, { color: colors.textSecondary }]}>No active alerts</Text>
              </View>
            ) : (
              alerts.filter(a => !a.isDismissed).map((alert) => {
              const iconSource = getAlertIconSource(alert.type);
              const color = DISASTER_COLORS[alert.type as keyof typeof DISASTER_COLORS] || '#6B7280';
              const dist = state.location
                ? calculateDistance(state.location.latitude, state.location.longitude, alert.coordinates.latitude, alert.coordinates.longitude)
                : null;
              const distKm = dist !== null ? (dist / 1000).toFixed(0) : null;

              return (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertMiniCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/alert/${alert.id}`)}
                >
                  <View style={[styles.alertIconWrap, { backgroundColor: `${color}15` }]}>
                    {iconSource ? (
                      <Image source={iconSource} style={[styles.alertIconImg, { tintColor: color }]} />
                    ) : (
                      <Ionicons name="warning" size={22} color={color} />
                    )}
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={[styles.alertName, { color: colors.text }]}>{capitalizeType(alert.type)}</Text>
                    <Text style={[styles.alertSeverity, { color }]}>{getSeverityLabel(alert.severity)}</Text>
                    {distKm && <Text style={[styles.alertDistance, { color: colors.textSecondary }]}>{distKm} km away</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerWrap: {
    height: SCREEN_H * 0.36,
    position: 'relative',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.36,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.36,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bannerBlur: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingAppIcon: {
    width: 108,
    height: 108,
    borderRadius: 28,
  },
  loadingText: { fontSize: 15, fontWeight: '500' },
  loadingFromAlan: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingBottom: 32,
  },
  navBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
    marginHorizontal: 10,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  greetingContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  taglineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
  },
  safeZoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: 170,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    gap: 4,
  },
  safeZoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeZoneIconImg: {
    width: 24,
    height: 24,
  },
  safeZoneTextWrap: {
    flex: 1,
  },
  safeZoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  safeZoneBold: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2332',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  alertsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  alertMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flex: 1,
    minWidth: 160,
    gap: 10,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconImg: {
    width: 22,
    height: 22,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2332',
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  alertDistance: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  emptyAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  emptyAlertText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  quickActionCard: {
    alignItems: 'center',
    gap: 6,
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconImg: {
    width: 36,
    height: 36,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A2332',
    textAlign: 'center',
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightIcon: {
    width: 24,
    height: 24,
  },
  insightLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    flexShrink: 1,
  },
  insightBody: {
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  insightBadge: {
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  insightFooterLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
  },
  insightFooterValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
});
