import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { useWeather } from '@/hooks/useWeather';

import WeatherCard from '@/components/WeatherCard';
import WeatherMetric from '@/components/WeatherMetric';
import AlertCard, { type AlertData, type AlertSeverity as AlertCardSeverity } from '@/components/AlertCard';
import ForecastItem from '@/components/ForecastItem';
import SectionHeader from '@/components/SectionHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchBar from '@/components/SearchBar';
import GradientBackground from '@/components/GradientBackground';

import { formatDate, capitalizeWords, getWindDirection } from '@/utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

function formatSunTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeScreen() {
  const { colors, resolvedMode } = useTheme();
  const { state } = useAppContext();
  const { filteredAlerts } = useAlertContext();
  const { isLoading, refresh, hourlyForecast, dailyForecast, airQuality, uvIndex } = useWeather();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const weather = state.weather;
  const location = state.location;

  const locationName = useMemo(() => {
    if (!location) return 'Locating...';
    const parts = [location.city, location.region, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  }, [location]);

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === 'dark'
      ? (['#0F172A', colors.background] as const)
      : (['#DBEAFE', colors.background] as const);
  }, [colors.background, resolvedMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const goToAlerts = useCallback(() => {
    router.navigate('/alerts' as any);
  }, [router]);

  const alertCards = useMemo((): AlertData[] => {
    return filteredAlerts
      .filter((a) => !a.isDismissed)
      .slice(0, 5)
      .map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.message,
        severity: alert.severity as AlertCardSeverity,
        type: alert.type,
        timeAgo: formatDate(alert.startTime, 'relative'),
        distance: '',
      }));
  }, [filteredAlerts]);

  const nextRainChance = useMemo(() => {
    if (hourlyForecast.length === 0) return null;
    for (const h of hourlyForecast.slice(0, 12)) {
      if (h.precipitationProbability > 0) return h.precipitationProbability;
    }
    return hourlyForecast[0]?.precipitationProbability ?? 0;
  }, [hourlyForecast]);

  const aiSummary = useMemo(() => {
    if (!weather) return null;
    const { current } = weather;
    const highlights: string[] = [];
    const warnings: string[] = [];

    if (current.temperature > 35) warnings.push('Extreme heat conditions. Stay hydrated.');
    else if (current.temperature > 30) highlights.push('Warm temperatures expected today.');
    else if (current.temperature < 5) warnings.push('Cold conditions. Dress warmly.');
    else if (current.temperature < 15) highlights.push('Cool and comfortable temperatures.');

    if (current.humidity > 80) highlights.push('High humidity levels throughout the day.');
    if (current.windSpeed > 40) warnings.push('Strong winds may cause disruptions.');
    if (uvIndex && uvIndex > 7) warnings.push('Very high UV index. Limit sun exposure.');
    else if (uvIndex && uvIndex > 5) highlights.push('Moderate to high UV. Use sunscreen.');
    if (airQuality && airQuality.aqi > 150) warnings.push('Poor air quality. Avoid outdoor activities.');
    else if (airQuality && airQuality.aqi > 100) highlights.push('Moderate air quality.');

    if (filteredAlerts.filter((a) => !a.isDismissed).length > 0) {
      warnings.push(`${filteredAlerts.filter((a) => !a.isDismissed).length} active alerts in your area.`);
    }

    if (highlights.length === 0) highlights.push('Generally calm weather conditions expected.');

    return {
      summary: `${capitalizeWords(current.description)} with a high of ${Math.round(current.temperature)}° and low of ${Math.round(dailyForecast[0]?.tempLow ?? current.temperature - 5)}°. ${capitalizeWords(current.description)} conditions will persist.`,
      highlights,
      warnings,
    };
  }, [weather, uvIndex, airQuality, filteredAlerts, dailyForecast]);

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
    [colors]
  );

  const hourlyKeyExtractor = useCallback(
    (item: typeof hourlyForecast[number], index: number) => `${item.time}-${index}`,
    []
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
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search location..."
          colors={{
            card: colors.surface,
            text: colors.text,
            textMuted: colors.textMuted,
            cardAlt: colors.surfaceVariant,
            accent: colors.primary,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 4,
            gap: 6,
          }}
        >
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              fontWeight: '500',
            }}
          >
            {locationName}
          </Text>
        </View>

        {weather && (
          <>
            <View style={{ marginTop: 12, marginBottom: 20 }}>
              <WeatherCard
                temperature={Math.round(weather.current.temperature)}
                condition={capitalizeWords(weather.current.description)}
                icon={getWeatherIonicon(weather.current.icon)}
                location={locationName}
                feelsLike={Math.round(weather.current.feelsLike)}
                colors={{
                  card: colors.surface,
                  cardAlt: colors.surfaceVariant,
                  text: colors.text,
                  textSecondary: colors.textSecondary,
                  textMuted: colors.textMuted,
                  icon: colors.primary,
                  accent: colors.primary,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <View style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <WeatherMetric
                  icon="leaf"
                  label="Air Quality"
                  value={airQuality ? `AQI ${airQuality.aqi}` : '--'}
                  color={airQuality ? getAQIColor(airQuality.aqi) : colors.textMuted}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
              <View style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <WeatherMetric
                  icon="sunny"
                  label="UV Index"
                  value={uvIndex !== null ? `${uvIndex}` : '--'}
                  color={uvIndex !== null ? getUVColor(uvIndex) : colors.textMuted}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
              <View style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <WeatherMetric
                  icon="water"
                  label="Humidity"
                  value={`${weather.current.humidity}%`}
                  color={colors.info}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
              <View style={{ width: (SCREEN_WIDTH - 52) / 2 }}>
                <WeatherMetric
                  icon="navigate"
                  label="Wind Speed"
                  value={`${Math.round(weather.current.windSpeed)} km/h ${getWindDirection(weather.current.windDirection)}`}
                  color={colors.primary}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <View style={{ flex: 1 }}>
                <WeatherMetric
                  icon="rainy"
                  label="Rain Chance"
                  value={nextRainChance !== null ? `${nextRainChance}%` : '0%'}
                  color={colors.info}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <WeatherMetric
                  icon="sunny"
                  label="Sunrise / Sunset"
                  value={`${formatSunTime(weather.current.sunrise)} / ${formatSunTime(weather.current.sunset)}`}
                  color={colors.warning}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    icon: colors.primary,
                    accent: colors.primary,
                    barTrack: colors.border,
                  }}
                />
              </View>
            </View>

            <SectionHeader
              title="Active Alerts"
              actionText="See All"
              onAction={goToAlerts}
              colors={{
                text: colors.text,
                accent: colors.primary,
                textMuted: colors.textMuted,
              }}
            />

            {alertCards.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 24 }}>
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
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  marginBottom: 24,
                  gap: 8,
                }}
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
                  style={{ marginBottom: 24 }}
                />
              </>
            )}

            {dailyForecast.length > 0 && (
              <>
                <SectionHeader
                  title="7-Day Forecast"
                  colors={{
                    text: colors.text,
                    accent: colors.primary,
                    textMuted: colors.textMuted,
                  }}
                />
                <View style={{ gap: 10, marginBottom: 24 }}>
                  {dailyForecast.slice(0, 7).map((day, index) => (
                    <View
                      key={day.date}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: index === 0 ? '700' : '500',
                          color: index === 0 ? colors.primary : colors.text,
                          width: 44,
                        }}
                      >
                        {index === 0 ? 'Today' : day.dayName}
                      </Text>
                      <Ionicons
                        name={getWeatherIonicon(day.icon)}
                        size={24}
                        color={colors.text}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textMuted,
                          width: 28,
                          textAlign: 'right',
                        }}
                      >
                        {Math.round(day.tempLow)}°
                      </Text>
                      <View style={{ flex: 1, marginHorizontal: 8 }}>
                        <View
                          style={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.border,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: '100%',
                              borderRadius: 2,
                              backgroundColor: colors.primary,
                              width: `${Math.min(((day.tempHigh - day.tempLow) / 20) * 100, 100)}%`,
                            }}
                          />
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: colors.text,
                          width: 28,
                        }}
                      >
                        {Math.round(day.tempHigh)}°
                      </Text>
                      {day.precipitationProbability > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, width: 36 }}>
                          <Ionicons name="water" size={12} color={colors.info} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textMuted,
                              fontWeight: '500',
                            }}
                          >
                            {day.precipitationProbability}%
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {aiSummary && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.primaryLight + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: colors.text,
                    }}
                  >
                    AI Weather Summary
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 22,
                    marginBottom: 14,
                  }}
                >
                  {aiSummary.summary}
                </Text>

                {aiSummary.highlights.length > 0 && (
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    {aiSummary.highlights.map((highlight, i) => (
                      <View
                        key={`hl-${i}`}
                        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
                      >
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color={colors.info}
                          style={{ marginTop: 1 }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.textSecondary,
                            lineHeight: 19,
                          }}
                        >
                          {highlight}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {aiSummary.warnings.length > 0 && (
                  <View style={{ gap: 8 }}>
                    {aiSummary.warnings.map((warning, i) => (
                      <View
                        key={`wr-${i}`}
                        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={16}
                          color={colors.warning}
                          style={{ marginTop: 1 }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.warning,
                            fontWeight: '500',
                            lineHeight: 19,
                          }}
                        >
                          {warning}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
