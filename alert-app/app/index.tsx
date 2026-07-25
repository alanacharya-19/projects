import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/ThemeContext';
import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { useWeather } from '@/hooks/useWeather';

import AlertCard, { type AlertData, type AlertSeverity as AlertCardSeverity } from '@/components/AlertCard';
import ForecastItem from '@/components/ForecastItem';
import SectionHeader from '@/components/SectionHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import GradientBackground from '@/components/GradientBackground';
import Sidebar from '@/components/Sidebar';
import FloatingMapButton from '@/components/FloatingMapButton';

import { formatDate, capitalizeWords } from '@/utils/helpers';
import { Gradients } from '@/constants/theme';

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

function getUVColor(uv: number): string {
  if (uv <= 2) return '#16A34A';
  if (uv <= 5) return '#F59E0B';
  if (uv <= 7) return '#F97316';
  return '#DC2626';
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#16A34A';
  if (aqi <= 100) return '#F59E0B';
  if (aqi <= 150) return '#F97316';
  if (aqi <= 200) return '#DC2626';
  return '#7C2D12';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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

function glassCardStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'rgba(16,33,59,0.7)' : 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  };
}

const EMERGENCY_SERVICES = [
  { key: 'hospital', label: 'Hospital', icon: 'medkit' as const, color: '#FF3B30', route: '/nearby-services' },
  { key: 'police', label: 'Police', icon: 'shield' as const, color: '#2EA8FF', route: '/nearby-services' },
  { key: 'fire', label: 'Fire Station', icon: 'flame' as const, color: '#FF9800', route: '/nearby-services' },
  { key: 'shelter', label: 'Shelter', icon: 'home' as const, color: '#00C853', route: '/nearby-services' },
];

export default function HomeScreen() {
  const { colors, resolvedMode } = useTheme();
  const { state } = useAppContext();
  const { filteredAlerts } = useAlertContext();
  const { isLoading, refresh, hourlyForecast, dailyForecast, airQuality, uvIndex } = useWeather();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const weather = state.weather;
  const location = state.location;
  const isDark = resolvedMode === 'dark';
  const userName = 'Alan';

  const activeAlerts = useMemo(() => {
    return filteredAlerts.filter((a) => !a.isDismissed);
  }, [filteredAlerts]);

  const alertCards = useMemo((): AlertData[] => {
    return activeAlerts.slice(0, 5).map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.message,
      severity: alert.severity as AlertCardSeverity,
      type: alert.type,
      timeAgo: formatDate(alert.startTime, 'relative'),
      distance: '',
    }));
  }, [activeAlerts]);

  const alertCount = activeAlerts.length;
  const hasSevereAlerts = alertCount > 0;

  useEffect(() => {
    if (hasSevereAlerts) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasSevereAlerts]);

  const locationName = useMemo(() => {
    if (!location) return 'Locating...';
    const parts = [location.city, location.region, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  }, [location]);

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === 'dark' ? Gradients.homeDark : Gradients.home;
  }, [resolvedMode]);

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

  const renderHourlyItem = useCallback(
    ({ item, index }: { item: typeof hourlyForecast[number]; index: number }) => (
      <ForecastItem
        time={index === 0 ? 'Now' : formatDate(item.time, 'time')}
        icon={getWeatherIonicon(item.icon)}
        temp={Math.round(item.temperature)}
        rainChance={item.precipitationProbability > 0 ? item.precipitationProbability : undefined}
        isNow={index === 0}
        colors={{
          card: colors.surface,
          cardAlt: colors.surfaceVariant,
          text: colors.text,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
          accent: colors.primary,
          activeCard: colors.primary,
        }}
      />
    ),
    [colors],
  );

  const hourlyKeyExtractor = useCallback(
    (item: typeof hourlyForecast[number], index: number) => `${item.time}-${index}`,
    [],
  );

  if (isLoading && !weather) {
    return (
      <GradientBackground colors={gradientColors}>
        <LoadingSpinner
          message="Loading weather data..."
          colors={{
            text: colors.text,
            textMuted: colors.textMuted,
            accent: colors.primary,
          }}
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground colors={gradientColors}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleNavigate}
        currentRoute="/"
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* === SECTION 1: Header Bar === */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setSidebarVisible(true)}
            style={{
              width: 44,
              height: 44,
              ...glassCardStyle(isDark),
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="menu" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            Disaster Alert
          </Text>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={goToAlerts}
            style={{
              width: 44,
              height: 44,
              ...glassCardStyle(isDark),
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {alertCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#FF3B30',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: isDark ? '#081426' : '#F0F2F5',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>
                  {alertCount > 99 ? '99+' : alertCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* === SECTION 2: Greeting + Safety Status === */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          {getGreeting()}, {userName}
        </Text>

        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            alignSelf: 'flex-start',
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 30,
              backgroundColor: hasSevereAlerts
                ? isDark ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.1)'
                : isDark ? 'rgba(0,200,83,0.2)' : 'rgba(0,200,83,0.1)',
              borderWidth: 1,
              borderColor: hasSevereAlerts
                ? 'rgba(255,59,48,0.4)'
                : 'rgba(0,200,83,0.4)',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: hasSevereAlerts ? '#FF3B30' : '#00C853',
                shadowColor: hasSevereAlerts ? '#FF3B30' : '#00C853',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
                elevation: 4,
              }}
            />
            <Ionicons
              name={hasSevereAlerts ? 'warning' : 'shield-checkmark'}
              size={16}
              color={hasSevereAlerts ? '#FF3B30' : '#00C853'}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: hasSevereAlerts ? '#FF3B30' : '#00C853',
                letterSpacing: 1,
              }}
            >
              {hasSevereAlerts ? `${alertCount} ALERT${alertCount > 1 ? 'S' : ''}` : 'SAFE'}
            </Text>
          </View>
        </Animated.View>

        {/* === SECTION 3: Current Weather Hero Card === */}
        {weather && (
          <LinearGradient
            colors={resolvedMode === 'dark' ? Gradients.heroCardDark : Gradients.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <Ionicons
              name={getWeatherIonicon(weather.current.icon)}
              size={64}
              color="#FFFFFF"
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontSize: 56,
                fontWeight: '200',
                color: '#FFFFFF',
                letterSpacing: -3,
                lineHeight: 62,
              }}
            >
              {Math.round(weather.current.temperature)}°
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.95)',
                marginTop: 2,
                textTransform: 'capitalize',
              }}
            >
              {capitalizeWords(weather.current.description)}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                gap: 6,
              }}
            >
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '500',
                }}
              >
                {locationName}
              </Text>
            </View>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: '500',
                }}
              >
                Feels like {Math.round(weather.current.feelsLike)}°
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* === SECTION 4: Quick Stats Row === */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <View style={[glassCardStyle(isDark), { padding: 14, alignItems: 'center' }]}>
              <Ionicons name="leaf" size={20} color={airQuality ? getAQIColor(airQuality.aqi) : colors.textMuted} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text,
                  marginTop: 6,
                }}
              >
                {airQuality ? airQuality.aqi : '--'}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 2 }}>AQI</Text>
              <View
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: airQuality ? getAQIColor(airQuality.aqi) : colors.border,
                  marginTop: 6,
                }}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={[glassCardStyle(isDark), { padding: 14, alignItems: 'center' }]}>
              <Ionicons name="sunny" size={20} color={uvIndex !== null ? getUVColor(uvIndex) : colors.textMuted} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text,
                  marginTop: 6,
                }}
              >
                {uvIndex !== null ? uvIndex : '--'}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 2 }}>UV</Text>
              <View
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: uvIndex !== null ? getUVColor(uvIndex) : colors.border,
                  marginTop: 6,
                }}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={[glassCardStyle(isDark), { padding: 14, alignItems: 'center' }]}>
              <Ionicons name="water" size={20} color={colors.info} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text,
                  marginTop: 6,
                }}
              >
                {weather ? `${weather.current.humidity}%` : '--'}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 2 }}>Humidity</Text>
              <View
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.info,
                  marginTop: 6,
                }}
              />
            </View>
          </View>
        </View>

        {/* === SECTION 5: Live Map CTA === */}
        <TouchableOpacity activeOpacity={0.85} onPress={goToMap}>
          <LinearGradient
            colors={isDark ? ['#0D2F4F', '#1A5276'] : ['#1A5276', '#2EA8FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: '#2EA8FF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="map" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Open Live Map</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                View disaster zones, shelters & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* === SECTION 6: Nearby Disasters === */}
        <SectionHeader
          title={`Nearby Disasters${alertCount > 0 ? ` (${alertCount})` : ''}`}
          actionText="See All"
          onAction={goToAlerts}
          colors={{
            text: colors.text,
            accent: colors.primary,
            textMuted: colors.textMuted,
          }}
        />

        {alertCards.length > 0 ? (
          <View style={{ gap: 10, marginBottom: 20 }}>
            {alertCards.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() => goToAlerts()}
                colors={{
                  card: colors.surface,
                  cardAlt: colors.surfaceVariant,
                  text: colors.text,
                  textSecondary: colors.textSecondary,
                  textMuted: colors.textMuted,
                  severityExtreme: colors.error,
                  severitySevere: '#F97316',
                  severityModerate: colors.warning,
                  severityMinor: colors.info,
                  divider: colors.divider,
                }}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              glassCardStyle(isDark),
              {
                padding: 24,
                alignItems: 'center',
                marginBottom: 20,
                gap: 8,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontWeight: '500',
              }}
            >
              No active alerts in your area
            </Text>
          </View>
        )}

        {/* === SECTION 7: Emergency Services Row === */}
        <SectionHeader
          title="Emergency Services"
          colors={{
            text: colors.text,
            accent: colors.primary,
            textMuted: colors.textMuted,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {EMERGENCY_SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.key}
              activeOpacity={0.7}
              onPress={() => router.push(svc.route as any)}
              style={{
                width: '48%',
                flexGrow: 1,
                minWidth: '47%',
              }}
            >
              <View
                style={[
                  glassCardStyle(isDark),
                  {
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isDark
                      ? `${svc.color}22`
                      : `${svc.color}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={svc.icon} size={20} color={svc.color} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    flex: 1,
                  }}
                >
                  {svc.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* === Hourly Forecast === */}
        {hourlyForecast.length > 0 && (
          <>
            <SectionHeader
              title="Hourly Forecast"
              colors={{
                text: colors.text,
                accent: colors.primary,
                textMuted: colors.textMuted,
              }}
            />
            <FlatList
              data={hourlyForecast.slice(0, 24)}
              renderItem={renderHourlyItem}
              keyExtractor={hourlyKeyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              style={{ marginBottom: 20 }}
            />
          </>
        )}

        {/* === SECTION 8: Emergency SOS Button === */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL('tel:911')}
          style={{ marginBottom: 24 }}
        >
          <LinearGradient
            colors={['#FF3B30', '#D32F2F', '#B71C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 20,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#FF3B30',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 17,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: 2,
              }}
            >
              EMERGENCY SOS
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <FloatingMapButton onPress={goToMap} />
    </GradientBackground>
  );
}
