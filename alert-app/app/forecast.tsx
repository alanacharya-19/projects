import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAppContext } from '@/context/AppContext';
import { useWeather } from '@/hooks/useWeather';
import ForecastItem from '@/components/ForecastItem';
import SectionHeader from '@/components/SectionHeader';
import WeatherMetric from '@/components/WeatherMetric';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import GradientBackground from '@/components/GradientBackground';
import { Spacing, Gradients } from '@/constants/theme';
import { formatTemperature, getWindDirection, formatDistance, capitalizeWords } from '@/utils/helpers';
import type { HourlyForecast, DailyForecast } from '@/types';

function getWeatherIconName(icon: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    '01d': 'sunny', '01n': 'moon', '02d': 'partly-sunny', '02n': 'cloudy-night',
    '03d': 'cloudy', '03n': 'cloudy', '04d': 'cloudy', '04n': 'cloudy',
    '09d': 'rainy', '09n': 'rainy', '10d': 'rainy', '10n': 'rainy',
    '11d': 'thunderstorm', '11n': 'thunderstorm', '13d': 'snow', '13n': 'snow',
    '50d': 'water', '50n': 'water',
  };
  return map[icon] ?? 'sunny';
}

function formatHour(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function isNow(timestamp: number): boolean {
  return Math.abs(timestamp - Math.floor(Date.now() / 1000)) < 3600;
}

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp * 1000);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

function sunriseToTime(sunrise: number): string {
  const d = new Date(sunrise * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function sunsetToTime(sunset: number): string {
  const d = new Date(sunset * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const { state, updateSettings } = useAppContext();
  const { isLoading, error, refresh, hourlyForecast, dailyForecast, uvIndex } = useWeather();
  const [refreshing, setRefreshing] = useState(false);

  const tempUnit = state.settings.temperatureUnit;
  const isCelsius = tempUnit === 'celsius';

  const toggleUnit = useCallback(() => {
    updateSettings({ temperatureUnit: isCelsius ? 'fahrenheit' : 'celsius' });
  }, [isCelsius, updateSettings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const forecastColors = {
    card: colors.surface,
    cardAlt: colors.surfaceVariant,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    accent: colors.primary,
    activeCard: colors.primary,
  };

  const metricColors = {
    card: colors.surface,
    cardAlt: colors.surfaceVariant,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    icon: colors.primary,
    accent: colors.primary,
    barTrack: colors.border,
  };

  const weather = state.weather;

  const currentSummary = useMemo(() => {
    if (!weather) return null;
    const { current } = weather;
    return {
      temp: formatTemperature(current.temperature, tempUnit),
      feelsLike: formatTemperature(current.feelsLike, tempUnit),
      description: capitalizeWords(current.description),
      icon: getWeatherIconName(current.icon),
      high: dailyForecast.length > 0 ? formatTemperature(dailyForecast[0].tempHigh, tempUnit) : null,
      low: dailyForecast.length > 0 ? formatTemperature(dailyForecast[0].tempLow, tempUnit) : null,
    };
  }, [weather, tempUnit, dailyForecast]);

  const metrics = useMemo(() => {
    if (!weather) return [] as { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[];
    const { current } = weather;
    return [
      { icon: 'thermometer' as const, label: 'Feels Like', value: formatTemperature(current.feelsLike, tempUnit) },
      { icon: 'water' as const, label: 'Humidity', value: `${current.humidity}%` },
      { icon: 'wind' as const, label: 'Wind', value: `${current.windSpeed} m/s ${getWindDirection(current.windDirection)}` },
      { icon: 'sunny' as const, label: 'UV Index', value: uvIndex != null ? `${uvIndex}` : 'N/A' },
      { icon: 'eye' as const, label: 'Visibility', value: formatDistance(current.visibility) },
      { icon: 'compass-outline' as const, label: 'Pressure', value: `${current.pressure} hPa` },
      { icon: 'sunny' as const, label: 'Sunrise', value: sunriseToTime(current.sunrise) },
      { icon: 'moon' as const, label: 'Sunset', value: sunsetToTime(current.sunset) },
    ];
  }, [weather, tempUnit, uvIndex]);

  const aiSummary = useMemo(() => {
    if (dailyForecast.length === 0) return null;
    const high = Math.max(...dailyForecast.map((d) => d.tempHigh));
    const low = Math.min(...dailyForecast.map((d) => d.tempLow));
    const rainyDays = dailyForecast.filter((d) => d.precipitationProbability > 50).length;
    return {
      summary: `The week ahead shows highs of ${formatTemperature(high, tempUnit)} and lows of ${formatTemperature(low, tempUnit)}. ${rainyDays > 0 ? `${rainyDays} day(s) with significant rain expected.` : 'Mostly dry conditions expected.'}`,
      highlights: [
        `High: ${formatTemperature(high, tempUnit)}`,
        `Low: ${formatTemperature(low, tempUnit)}`,
        `Rain: ${rainyDays > 0 ? `${rainyDays} days` : 'Minimal'}`,
      ],
    };
  }, [dailyForecast, tempUnit]);

  if (isLoading && !weather) {
    return <LoadingSpinner message="Loading forecast..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />;
  }

  if (error && !weather) {
    return (
      <EmptyState
        icon="cloud-offline"
        title="Unable to Load Forecast"
        description={error}
        actionText="Retry"
        onAction={onRefresh}
        colors={{
          card: colors.surface,
          cardAlt: colors.surfaceVariant,
          text: colors.text,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
          accent: colors.primary,
        }}
      />
    );
  }

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? Gradients.forecastDark : Gradients.forecast}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {currentSummary && (
          <LinearGradient
            colors={resolvedMode === 'dark' ? Gradients.heroCardDark : Gradients.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 28,
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
              name={currentSummary.icon}
              size={64}
              color="#FFFFFF"
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontSize: 72,
                fontWeight: '200',
                color: '#FFFFFF',
                letterSpacing: -4,
                lineHeight: 80,
              }}
            >
              {currentSummary.temp}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.95)',
                marginBottom: 6,
                textTransform: 'capitalize',
              }}
            >
              {currentSummary.description}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Feels like {currentSummary.feelsLike} · H:{currentSummary.high} L:{currentSummary.low}
            </Text>
          </LinearGradient>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignSelf: 'center',
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 3,
            backgroundColor: colors.surface,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleUnit}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: isCelsius ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isCelsius ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              °C
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleUnit}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: !isCelsius ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: !isCelsius ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              °F
            </Text>
          </TouchableOpacity>
        </View>

        <SectionHeader
          title="Hourly Forecast"
          colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: Spacing.sm, marginBottom: 24 }}
        >
          {hourlyForecast.length > 0 ? (
            hourlyForecast.filter((h) => isToday(h.time)).length > 0 ? (
              hourlyForecast.filter((h) => isToday(h.time)).map((h: HourlyForecast) => (
                <ForecastItem
                  key={h.time}
                  time={isNow(h.time) ? 'Now' : formatHour(h.time)}
                  icon={getWeatherIconName(h.icon)}
                  temp={Math.round(tempUnit === 'fahrenheit' ? h.temperature * 9 / 5 + 32 : h.temperature)}
                  rainChance={h.precipitationProbability}
                  isNow={isNow(h.time)}
                  colors={forecastColors}
                />
              ))
            ) : (
              hourlyForecast.slice(0, 24).map((h: HourlyForecast) => (
                <ForecastItem
                  key={h.time}
                  time={isNow(h.time) ? 'Now' : formatHour(h.time)}
                  icon={getWeatherIconName(h.icon)}
                  temp={Math.round(tempUnit === 'fahrenheit' ? h.temperature * 9 / 5 + 32 : h.temperature)}
                  rainChance={h.precipitationProbability}
                  isNow={isNow(h.time)}
                  colors={forecastColors}
                />
              ))
            )
          ) : (
            <View style={{ width: Dimensions.get('window').width - 40, alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                No hourly data available
              </Text>
            </View>
          )}
        </ScrollView>

        <SectionHeader
          title="7-Day Forecast"
          colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 4,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {dailyForecast.length > 0 ? (
            dailyForecast.map((day: DailyForecast, idx: number) => (
              <View
                key={day.date}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderBottomWidth: idx < dailyForecast.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: idx === 0 ? '700' : '500',
                    color: idx === 0 ? colors.primary : colors.text,
                    width: 52,
                  }}
                >
                  {idx === 0 ? 'Today' : day.dayName}
                </Text>
                <Ionicons
                  name={getWeatherIconName(day.icon)}
                  size={22}
                  color={colors.primary}
                  style={{ width: 30 }}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textMuted,
                    width: 32,
                    textAlign: 'right',
                  }}
                >
                  {formatTemperature(day.tempLow, tempUnit)}
                </Text>
                <View
                  style={{
                    flex: 1,
                    marginHorizontal: 12,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: colors.border,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      backgroundColor: colors.primary,
                      width: `${Math.min(((day.tempHigh - day.tempLow) / 20) * 100, 100)}%`,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.text,
                    width: 32,
                    textAlign: 'right',
                  }}
                >
                  {formatTemperature(day.tempHigh, tempUnit)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    width: 44,
                    justifyContent: 'flex-end',
                  }}
                >
                  {day.precipitationProbability > 0 && (
                    <>
                      <Ionicons name="water" size={12} color={colors.info} />
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textMuted,
                          fontWeight: '500',
                        }}
                      >
                        {day.precipitationProbability}%
                      </Text>
                    </>
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: 'right',
                    marginLeft: 8,
                  }}
                  numberOfLines={1}
                >
                  {capitalizeWords(day.description)}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                No forecast data available
              </Text>
            </View>
          )}
        </View>

        <SectionHeader
          title="Weather Details"
          colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
        />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {metrics.map((m) => (
            <View key={m.label} style={{ width: '48%' }}>
              <WeatherMetric icon={m.icon as keyof typeof Ionicons.glyphMap} label={m.label} value={m.value} colors={metricColors} />
            </View>
          ))}
        </View>

        {aiSummary && (
          <LinearGradient
            colors={resolvedMode === 'dark' ? Gradients.aiSummaryDark : Gradients.aiSummary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
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
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                AI Weather Summary
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 22,
                marginBottom: 14,
              }}
            >
              {aiSummary.summary}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {aiSummary.highlights.map((h, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 9999,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
                    {h}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
