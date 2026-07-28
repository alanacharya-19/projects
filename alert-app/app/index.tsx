import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { useWeather } from '@/hooks/useWeather';
import { useLocation } from '@/hooks/useLocation';
import { calculateDistance } from '@/services/locationService';
import { DISASTER_COLORS } from '@/constants/theme';

import Sidebar from '@/components/Sidebar';

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

function getWeatherIcon(code: string): keyof typeof Ionicons.glyphMap {
  if (code.startsWith('01')) return 'sunny';
  if (code.startsWith('02')) return 'partly-sunny';
  if (code.startsWith('03') || code.startsWith('04')) return 'cloudy';
  if (code.startsWith('09') || code.startsWith('10')) return 'rainy';
  if (code.startsWith('11')) return 'thunderstorm';
  if (code.startsWith('13')) return 'snow';
  return 'partly-sunny';
}

function getWeatherEmoji(code: string): string {
  if (code.startsWith('01')) return '☀️';
  if (code.startsWith('02')) return '⛅';
  if (code.startsWith('03') || code.startsWith('04')) return '☁️';
  if (code.startsWith('09') || code.startsWith('10')) return '🌧️';
  if (code.startsWith('11')) return '⛈️';
  if (code.startsWith('13')) return '❄️';
  return '🌤️';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const { isLoading, refresh } = useWeather();
  const { isLoading: locationLoading } = useLocation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
      <LinearGradient colors={['#DDEEFF', '#F8FBFF', '#FFFFFF']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="cloudy" size={48} color="#3B82F6" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DDEEFF', '#F8FBFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <Image source={getBannerImage()} style={styles.banner} resizeMode="cover" />

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

        <TouchableOpacity style={styles.navIcon} onPress={() => router.push('/alerts')} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.greetingContainer, { top: insets.top + 64 }]}>
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

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={handleNavigate} currentRoute="/" />

      <View style={[styles.weatherCardOuter, { top: SCREEN_H * 0.4 - 60 }]}>
        <View style={styles.weatherCard}>
          <View style={styles.weatherTop}>
            <View style={styles.weatherLeft}>
              <Text style={styles.weatherLabel}>Today's Weather</Text>
              <View style={styles.weatherTempRow}>
                <Text style={styles.weatherTemp}>
                  {weather ? `${Math.round(weather.current.temperature)}°` : '--°'}
                  <Text style={styles.weatherUnit}>C</Text>
                </Text>
                <Text style={styles.weatherDesc}>{getWeatherEmoji(weather?.current.icon || '01d')} {weather?.current.main || 'Loading...'}</Text>
              </View>
              <Text style={styles.weatherFeels}>
                Feels like {weather ? `${Math.round(weather.current.feelsLike)}°` : '--'}
              </Text>
            </View>
            <Ionicons
              name={getWeatherIcon(weather?.current.icon || '01d')}
              size={52}
              color="#3B82F6"
            />
          </View>
          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <Image source={require('../assets/icons/humidity.png')} style={styles.weatherStatIcon} />
              <View style={styles.weatherStatText}>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
                <Text style={styles.weatherStatValue}>{weather ? `${weather.current.humidity}%` : '--'}</Text>
              </View>
            </View>
            <View style={styles.weatherStatDivider} />
            <View style={styles.weatherStat}>
              <Image source={require('../assets/icons/wind.png')} style={styles.weatherStatIcon} />
              <View style={styles.weatherStatText}>
                <Text style={styles.weatherStatLabel}>Wind</Text>
                <Text style={styles.weatherStatValue}>{weather ? `${Math.round(weather.current.windSpeed)}km/h` : '--'}</Text>
              </View>
            </View>
            <View style={styles.weatherStatDivider} />
            <View style={styles.weatherStat}>
              <Image source={require('../assets/icons/precipitation.png')} style={styles.weatherStatIcon} />
              <View style={styles.weatherStatText}>
                <Text style={styles.weatherStatLabel}>Precip.</Text>
                <Text style={styles.weatherStatValue}>{weather ? `${weather.hourly?.[0]?.precipitationProbability ?? 0}%` : '--'}</Text>
              </View>
            </View>
            <View style={styles.weatherStatDivider} />
            <View style={styles.weatherStat}>
              <Image source={require('../assets/icons/visibility.png')} style={styles.weatherStatIcon} />
              <View style={styles.weatherStatText}>
                <Text style={styles.weatherStatLabel}>Visibility</Text>
                <Text style={styles.weatherStatValue}>{weather ? `${(weather.current.visibility / 1000).toFixed(0)}km` : '--'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.weatherBottomDivider} />
          <View style={styles.sunRow}>
            <View style={styles.sunItem}>
              <Image source={require('../assets/icons/sunrise.png')} style={styles.sunIcon} />
              <View>
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunValue}>{weather ? formatTime(weather.current.sunrise) : '--'}</Text>
              </View>
            </View>
            <View style={styles.sunDivider} />
            <View style={styles.sunItem}>
              <Image source={require('../assets/icons/sunset.png')} style={styles.sunIcon} />
              <View>
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunValue}>{weather ? formatTime(weather.current.sunset) : '--'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: SCREEN_H * 0.4 + 160, paddingBottom: insets.bottom + 34, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {[
            { icon: 'alert-circle' as const, label: 'SOS', color: '#EF4444', route: '/emergency' },
            { icon: 'map' as const, label: 'Live Map', color: '#3B82F6', route: '/map' },
            { icon: 'business' as const, label: 'Nearby Shelters', color: '#22C55E', route: '/nearby-services' },
            { icon: 'partly-sunny' as const, label: 'Weather', color: '#F97316', route: '/forecast' },
            { icon: 'medkit' as const, label: 'Medical Services', color: '#3B82F6', route: '/nearby-services' },
            { icon: 'call' as const, label: 'Emergency Contacts', color: '#22C55E', route: '/emergency' },
            { icon: 'notifications' as const, label: 'Alerts', color: '#EF4444', route: '/alerts' },
            { icon: 'chatbubble-ellipses' as const, label: 'AI Assistant', color: '#8B5CF6', route: '/ai-chat' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/alerts')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsScroll} contentContainerStyle={styles.alertsScrollContent}>
          {alerts.filter(a => !a.isDismissed).length === 0 ? (
            <View style={styles.emptyAlertCard}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={styles.emptyAlertText}>No active alerts</Text>
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
                  style={styles.alertMiniCard}
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
                    <Text style={styles.alertName}>{capitalizeType(alert.type)}</Text>
                    <Text style={[styles.alertSeverity, { color }]}>{getSeverityLabel(alert.severity)}</Text>
                    {distKm && <Text style={styles.alertDistance}>{distKm} km away</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.4,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
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
    maxWidth: 160,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
    gap: 6,
  },
  safeZoneIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeZoneIconImg: {
    width: 18,
    height: 18,
  },
  safeZoneTextWrap: {
    flex: 1,
  },
  safeZoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
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
  weatherCardOuter: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flex: 1,
  },
  weatherLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  weatherTemp: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1A2332',
  },
  weatherUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  weatherDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  weatherFeels: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  weatherDivider: {
    height: 1,
    backgroundColor: '#D1D8E0',
    marginVertical: 14,
  },
  weatherStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  weatherStatIcon: {
    width: 16,
    height: 16,
  },
  weatherStatText: {
    flexShrink: 1,
  },
  weatherStatLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
  },
  weatherStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2332',
  },
  weatherStatDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#D1D8E0',
    marginHorizontal: 4,
  },
  weatherBottomDivider: {
    height: 1,
    backgroundColor: '#D1D8E0',
    marginTop: 14,
  },
  sunRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 14,
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  sunDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#D1D8E0',
  },
  sunIcon: {
    width: 22,
    height: 22,
  },
  sunLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
  },
  sunValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2332',
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
  alertsScroll: {
    marginTop: 14,
  },
  alertsScrollContent: {
    gap: 12,
  },
  alertMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 220,
    gap: 10,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A2332',
    textAlign: 'center',
  },
});
