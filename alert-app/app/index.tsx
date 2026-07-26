import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Animated,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { useWeather } from '@/hooks/useWeather';

import Sidebar from '@/components/Sidebar';

import { formatDate, capitalizeWords } from '@/utils/helpers';

const QUICK_ACTIONS = [
  { key: 'sos', label: 'SOS', icon: 'call' as const, color: '#FF3B30', bgColor: '#FF3B3015', route: '/emergency' },
  { key: 'shelters', label: 'Nearby Shelters', icon: 'home' as const, color: '#34C759', bgColor: '#34C75915', route: '/nearby-services' },
  { key: 'medical', label: 'Medical Services', icon: 'medkit' as const, color: '#2E7DFF', bgColor: '#2E7DFF15', route: '/nearby-services' },
  { key: 'contacts', label: 'Emergency Contacts', icon: 'people' as const, color: '#FF9500', bgColor: '#FF950015', route: '/nearby-services' },
  { key: 'report', label: 'Report Incident', icon: 'alert-circle' as const, color: '#AF52DE', bgColor: '#AF52DE15', route: '/emergency' },
];

const DISASTER_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  earthquake: 'pulse',
  wildfire: 'flame',
  flood: 'water',
  hurricane: 'cloudy',
  tornado: 'thunderstorm',
  tsunami: 'water',
  landslide: 'triangle',
  lightning: 'flash',
  snowstorm: 'snow',
  heatwave: 'thermometer',
  cyclone: 'cloudy',
  cold_wave: 'snow',
  weather: 'cloud',
  air_quality: 'leaf',
  custom: 'alert-circle',
};

function glassCardStyle() {
  return {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };
}

function getWeatherIonicon(iconCode: string): keyof typeof Ionicons.glyphMap {
  const isNight = iconCode.endsWith('n');
  const code = iconCode.substring(0, 2);
  const map: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
    '01': ['sunny', 'moon'],
    '02': ['partly-sunny', 'cloudy-night'],
    '03': ['cloudy', 'cloudy'],
    '04': ['cloudy', 'cloudy'],
    '09': ['rainy', 'rainy'],
    '10': ['rainy', 'rainy'],
    '11': ['thunderstorm', 'thunderstorm'],
    '13': ['snow', 'snow'],
    '50': ['water', 'water'],
  };
  const [day, night] = map[code] || map['01'];
  return isNight ? night : day;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function getUVColor(uv: number): string {
  if (uv <= 2) return '#34C759';
  if (uv <= 5) return '#FF9500';
  if (uv <= 7) return '#FF6B35';
  return '#FF3B30';
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#34C759';
  if (aqi <= 100) return '#FF9500';
  if (aqi <= 150) return '#FF6B35';
  if (aqi <= 200) return '#FF3B30';
  return '#AF52DE';
}

function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'extreme': return '#FF3B30';
    case 'severe': return '#FF6B35';
    case 'moderate': return '#FF9500';
    case 'minor': return '#2E7DFF';
    default: return '#94A3B8';
  }
}

function getBannerImage(): number {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return require('../assets/banner/5am-8am.png');
  if (hour >= 8 && hour < 12) return require('../assets/banner/8am-12pm.jpg');
  if (hour >= 12 && hour < 16) return require('../assets/banner/12pm-4pm.jpg');
  if (hour >= 16 && hour < 18.5) return require('../assets/banner/4pm-6.30pm.jpg');
  if (hour >= 18.5 && hour < 22) return require('../assets/banner/6.30pm-10pm.jpg');
  return require('../assets/banner/10pm-5am.jpg');
}

function formatTimeFromTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function HomeScreen() {
  const { state } = useAppContext();
  const { filteredAlerts } = useAlertContext();
  const { isLoading, refresh, dailyForecast, airQuality, uvIndex } = useWeather();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const weather = state.weather;
  const userName = 'Alan';

  const activeAlerts = useMemo(() => {
    return filteredAlerts.filter((a) => !a.isDismissed);
  }, [filteredAlerts]);

  const alertCount = activeAlerts.length;
  const hasAlerts = alertCount > 0;

  useEffect(() => {
    if (hasAlerts) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasAlerts, pulseAnim]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const goToAlerts = useCallback(() => {
    router.push('/alerts' as any);
  }, [router]);

  const goToMap = useCallback(() => {
    router.push('/map' as any);
  }, [router]);

  const handleNavigate = useCallback(
    (route: string) => {
      if (route === '/') return;
      router.push(route as any);
    },
    [router],
  );

  if (isLoading && !weather) {
    return (
      <View style={[styles.container, { backgroundColor: '#F7F9FC' }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="cloudy" size={48} color="#2E7DFF" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F7F9FC' }]}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleNavigate}
        currentRoute="/"
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2E7DFF"
            colors={['#2E7DFF']}
          />
        }
      >
        {/* === HEADER BANNER (Sections 1-3) === */}
        <ImageBackground
          source={getBannerImage()}
          style={[styles.bannerImage, { paddingTop: insets.top + 12 }]}
          imageStyle={styles.bannerImageInner}
        >
          {/* === SECTION 1: Header Bar === */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setSidebarVisible(true)}
              style={styles.headerButton}
            >
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={styles.locationSelector}>
              <Text style={styles.locationTextBanner}>📍 Kathmandu, Nepal</Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={goToAlerts}
              style={styles.headerButton}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {alertCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* === SECTION 2: Hero Greeting === */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTextBanner}>{getGreeting()}</Text>
            <Text style={styles.userNameBanner}>{userName} 👋</Text>
            <Text style={styles.greetingSubtitleBanner}>Stay safe, stay informed.</Text>
          </View>

          {/* === SECTION 3: Safe Zone Card === */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 20 }}>
            <TouchableOpacity activeOpacity={0.85}>
              <View style={hasAlerts ? styles.alertPillBanner : styles.safePillBanner}>
                <Ionicons
                  name={hasAlerts ? 'warning' : 'shield-checkmark'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={hasAlerts ? styles.alertPillTextBanner : styles.safePillTextBanner}>
                  {hasAlerts
                    ? `${alertCount} Alert${alertCount > 1 ? 's' : ''} Active`
                    : 'You are in Safe Zone'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>

        <View style={{ paddingHorizontal: 20 }}>
        {weather && (
          <View style={[glassCardStyle(), { padding: 24, marginBottom: 20 }]}>
            <Text style={styles.weatherTitle}>Today&apos;s Weather</Text>
            <View style={styles.weatherMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weatherTemp}>{Math.round(weather.current.temperature)}°C</Text>
                <Text style={styles.weatherCondition}>{capitalizeWords(weather.current.description)}</Text>
                <Text style={styles.weatherFeels}>Feels like {Math.round(weather.current.feelsLike)}°</Text>
              </View>
              <View style={styles.weatherIconContainer}>
                <Ionicons
                  name={getWeatherIonicon(weather.current.icon)}
                  size={72}
                  color="#FFB830"
                />
              </View>
            </View>

            <View style={styles.weatherStatsDivider} />

            <View style={styles.weatherStatsGrid}>
              <View style={styles.weatherStat}>
                <Ionicons name="water" size={16} color="#2E7DFF" />
                <Text style={styles.weatherStatValue}>{weather.current.humidity}%</Text>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="speedometer" size={16} color="#2E7DFF" />
                <Text style={styles.weatherStatValue}>{Math.round(weather.current.windSpeed)} km/h</Text>
                <Text style={styles.weatherStatLabel}>Wind</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="rainy" size={16} color="#2E7DFF" />
                <Text style={styles.weatherStatValue}>
                  {dailyForecast.length > 0 ? `${dailyForecast[0].precipitationProbability}%` : '--'}
                </Text>
                <Text style={styles.weatherStatLabel}>Precip.</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="eye" size={16} color="#2E7DFF" />
                <Text style={styles.weatherStatValue}>{(weather.current.visibility / 1000).toFixed(1)} km</Text>
                <Text style={styles.weatherStatLabel}>Visibility</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="arrow-up" size={16} color="#FF9500" />
                <Text style={styles.weatherStatValue}>{formatTimeFromTimestamp(weather.current.sunrise)}</Text>
                <Text style={styles.weatherStatLabel}>Sunrise</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="arrow-down" size={16} color="#FF9500" />
                <Text style={styles.weatherStatValue}>{formatTimeFromTimestamp(weather.current.sunset)}</Text>
                <Text style={styles.weatherStatLabel}>Sunset</Text>
              </View>
            </View>
          </View>
        )}

        {/* === SECTION 5: Active Alerts (Horizontal Scroll) === */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          <TouchableOpacity onPress={goToAlerts} activeOpacity={0.7}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeAlerts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingRight: 20 }}
            style={{ marginBottom: 20, marginLeft: -20, paddingLeft: 20 }}
          >
            {activeAlerts.slice(0, 8).map((alert) => (
              <TouchableOpacity
                key={alert.id}
                activeOpacity={0.85}
                onPress={goToAlerts}
                style={styles.alertCard}
              >
                <View style={[styles.alertCardStripe, { backgroundColor: getSeverityColor(alert.severity) }]} />
                <View style={styles.alertCardContent}>
                  <View style={styles.alertCardIconRow}>
                    <View style={[styles.alertCardIcon, { backgroundColor: `${getSeverityColor(alert.severity)}15` }]}>
                      <Ionicons
                        name={DISASTER_ICON_MAP[alert.type] || 'alert-circle'}
                        size={18}
                        color={getSeverityColor(alert.severity)}
                      />
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor(alert.severity)}18` }]}>
                      <Text style={[styles.severityBadgeText, { color: getSeverityColor(alert.severity) }]}>
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.alertCardTitle} numberOfLines={2}>{alert.title}</Text>
                  <Text style={styles.alertCardTime}>{formatDate(alert.startTime, 'relative')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={[glassCardStyle(), { padding: 28, alignItems: 'center', marginBottom: 20, gap: 10 }]}>
            <Ionicons name="checkmark-circle" size={36} color="#34C759" />
            <Text style={{ fontSize: 14, color: '#5A6B7F', fontWeight: '600' }}>No active alerts</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>All clear in your area</Text>
          </View>
        )}

        {/* === SECTION 6: Quick Actions (2x3 Grid) === */}
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as any)}
              style={styles.quickActionItem}
            >
              <View style={[glassCardStyle(), styles.quickActionCard]}>
                <View style={[styles.quickActionIconCircle, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={2}>{action.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* === SECTION 7: Live Situation Map === */}
        <View style={[glassCardStyle(), { padding: 0, marginTop: 20, marginBottom: 20, overflow: 'hidden' }]}>
          <View style={styles.mapPreviewContainer}>
            <View style={styles.mapPreviewBg}>
              <View style={[styles.mapDot, { backgroundColor: '#2E7DFF', width: 14, height: 14, borderRadius: 7, top: '45%', left: '48%' }]} />
              <View style={[styles.mapDot, { backgroundColor: '#FF3B30', width: 10, height: 10, borderRadius: 5, top: '30%', left: '25%' }]} />
              <View style={[styles.mapDot, { backgroundColor: '#FF9500', width: 10, height: 10, borderRadius: 5, top: '60%', left: '70%' }]} />
              <View style={[styles.mapDot, { backgroundColor: '#34C759', width: 10, height: 10, borderRadius: 5, top: '25%', left: '75%' }]} />
              <View style={[styles.mapDot, { backgroundColor: '#AF52DE', width: 10, height: 10, borderRadius: 5, top: '70%', left: '30%' }]} />
              <View style={styles.mapGridLine1} />
              <View style={styles.mapGridLine2} />
              <View style={styles.mapGridLine3} />
              <View style={styles.mapGridLine4} />
            </View>
            <View style={styles.mapOverlay}>
              <View style={styles.mapLabelContainer}>
                <Ionicons name="location" size={14} color="#2E7DFF" />
                <Text style={styles.mapLabel}>Your Location</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={goToMap} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>See Full Map</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* === SECTION 8: Floating Buttons are rendered outside ScrollView === */}

        {/* === SECTION 9: More Insights (3 Cards) === */}
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>More Insights</Text>
        <View style={{ gap: 12, marginBottom: 20 }}>
          {/* Air Quality */}
          <View style={[glassCardStyle(), styles.insightCard]}>
            <View style={[styles.insightIconCircle, { backgroundColor: `${getAQIColor(airQuality?.aqi ?? 42)}15` }]}>
              <Ionicons name="leaf" size={22} color={getAQIColor(airQuality?.aqi ?? 42)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightValue}>{airQuality?.aqi ?? 42}</Text>
              <Text style={styles.insightLabel}>Air Quality · {getAQILabel(airQuality?.aqi ?? 42)}</Text>
            </View>
            <View style={[styles.insightIndicator, { backgroundColor: getAQIColor(airQuality?.aqi ?? 42) }]} />
          </View>

          {/* UV Index */}
          <View style={[glassCardStyle(), styles.insightCard]}>
            <View style={[styles.insightIconCircle, { backgroundColor: `${getUVColor(uvIndex ?? 3)}15` }]}>
              <Ionicons name="sunny" size={22} color={getUVColor(uvIndex ?? 3)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightValue}>{uvIndex ?? 3}</Text>
              <Text style={styles.insightLabel}>UV Index · {(uvIndex ?? 3) <= 2 ? 'Low' : (uvIndex ?? 3) <= 5 ? 'Moderate' : 'High'}</Text>
            </View>
            <View style={[styles.insightIndicator, { backgroundColor: getUVColor(uvIndex ?? 3) }]} />
          </View>

          {/* Today's Risk */}
          <View style={[glassCardStyle(), styles.insightCard]}>
            <View style={[styles.insightIconCircle, { backgroundColor: hasAlerts ? '#FF3B3015' : '#34C75915' }]}>
              <Ionicons name={hasAlerts ? 'warning' : 'shield-checkmark'} size={22} color={hasAlerts ? '#FF3B30' : '#34C759'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightValue}>{hasAlerts ? 'High' : 'Low'}</Text>
              <Text style={styles.insightLabel}>Today&apos;s Risk · {hasAlerts ? 'Stay Alert' : 'Stay Alert'}</Text>
            </View>
            <View style={[styles.insightIndicator, { backgroundColor: hasAlerts ? '#FF3B30' : '#34C759' }]} />
          </View>
        </View>

        {/* === SECTION 10: Stay Prepared Card === */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/survival-guide' as any)}>
          <View style={[glassCardStyle(), styles.preparedCard]}>
            <View style={styles.preparedIconCircle}>
              <Ionicons name="shield-checkmark" size={28} color="#2E7DFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.preparedTitle}>Stay Prepared</Text>
              <Text style={styles.preparedDesc}>
                Keep an emergency kit, stay updated and stay safe.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* === SECTION 11: Emergency SOS Button === */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 20, marginBottom: 20 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Linking.openURL('tel:112')}
            style={styles.sosButtonShadow}
          >
            <LinearGradient
              colors={['#FF3B30', '#D32F2F', '#B71C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosButton}
            >
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        </View>
      </ScrollView>

      {/* === Floating Buttons (Right Side) === */}
      <View style={[styles.floatingButtonsContainer, { top: insets.top + 80 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={goToMap}
          style={styles.floatingMapButton}
        >
          <Ionicons name="map" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/ai-chat' as any)}
          style={styles.floatingAIButton}
        >
          <Ionicons name="sparkles" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerImage: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingBottom: 4,
    paddingTop: 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bannerImageInner: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5A6B7F',
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
    letterSpacing: -0.2,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Banner text overrides
  locationTextBanner: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  greetingTextBanner: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  userNameBanner: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  greetingSubtitleBanner: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 4,
  },

  // Banner safe/alert pill
  safePillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  safePillTextBanner: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  alertPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  alertPillTextBanner: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Greeting
  greetingSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  userName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A2332',
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 4,
  },

  // Safe/Alert Pill
  safePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  safePillText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    letterSpacing: 0.2,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  alertPillText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    letterSpacing: 0.2,
  },

  // Weather
  weatherTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 4,
  },
  weatherMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -3,
    lineHeight: 62,
  },
  weatherCondition: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 2,
  },
  weatherFeels: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  weatherIconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherStatsDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  weatherStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weatherStat: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  weatherStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2332',
  },
  weatherStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7DFF',
  },

  // Alert Cards
  alertCard: {
    width: 200,
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  alertCardStripe: {
    width: 4,
  },
  alertCardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  alertCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2332',
    lineHeight: 18,
  },
  alertCardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickActionItem: {
    width: '30.5%',
  },
  quickActionCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  quickActionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A2332',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Map Preview
  mapPreviewContainer: {
    height: 180,
    position: 'relative',
  },
  mapPreviewBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F0FE',
  },
  mapDot: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mapGridLine1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapGridLine2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapGridLine3: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapGridLine4: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
  },
  mapLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2332',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2E7DFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Insights
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  insightIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.3,
  },
  insightLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  insightIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Stay Prepared
  preparedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
    marginBottom: 20,
  },
  preparedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2E7DFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 2,
  },
  preparedDesc: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    lineHeight: 18,
  },

  // SOS Button
  sosButtonShadow: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  sosButton: {
    borderRadius: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2.5,
  },

  // Floating Buttons
  floatingButtonsContainer: {
    position: 'absolute',
    right: 20,
    gap: 12,
    zIndex: 10,
  },
  floatingMapButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7DFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  floatingAIButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#AF52DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#AF52DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
