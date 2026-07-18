import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAppContext } from '@/context/AppContext';
import { useWeather } from '@/hooks/useWeather';
import ForecastItem from '@/components/ForecastItem';
import SectionHeader from '@/components/SectionHeader';
import WeatherMetric from '@/components/WeatherMetric';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import GradientBackground from '@/components/GradientBackground';
import { Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
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
      colors={resolvedMode === 'dark' ? ['#0F172A', '#1E293B'] as const : ['#EFF6FF', '#F8FAFC'] as const}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.unitToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleUnit}
            style={[styles.unitButton, isCelsius && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.unitText, { color: isCelsius ? colors.white : colors.textSecondary }]}>°C</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleUnit}
            style={[styles.unitButton, !isCelsius && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.unitText, { color: !isCelsius ? colors.white : colors.textSecondary }]}>°F</Text>
          </TouchableOpacity>
        </View>

        {currentSummary && (
          <View style={[styles.currentCard, { backgroundColor: colors.surface }]}>
            <View style={styles.currentMain}>
              <View style={styles.currentTempRow}>
                <Ionicons name={currentSummary.icon} size={48} color={colors.primary} />
                <Text style={[styles.currentTemp, { color: colors.text }]}>{currentSummary.temp}</Text>
              </View>
              <Text style={[styles.currentDescription, { color: colors.textSecondary }]}>{currentSummary.description}</Text>
              <Text style={[styles.currentFeelsLike, { color: colors.textMuted }]}>
                Feels like {currentSummary.feelsLike} &middot; H:{currentSummary.high} L:{currentSummary.low}
              </Text>
            </View>
          </View>
        )}

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader title="Today" colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.sm }}
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
              <View style={{ width: Dimensions.get('window').width - Spacing.lg * 2, alignItems: 'center', paddingVertical: Spacing.xl }}>
                <Text style={{ color: colors.textMuted, fontSize: FontSizes.md }}>
                  No hourly data available
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader title="7-Day Forecast" colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }} />
          <View style={[styles.dailyContainer, { backgroundColor: colors.surface }]}>
            {dailyForecast.length > 0 ? (
              dailyForecast.map((day: DailyForecast, idx: number) => (
                <View
                  key={day.date}
                  style={[
                    styles.dailyRow,
                    idx < dailyForecast.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.dailyDayName, { color: colors.text }]}>
                    {idx === 0 ? 'Today' : day.dayName}
                  </Text>
                  <Ionicons name={getWeatherIconName(day.icon)} size={22} color={colors.primary} />
                  <View style={styles.dailyTemps}>
                    <Text style={[styles.dailyTempHigh, { color: colors.text }]}>
                      {formatTemperature(day.tempHigh, tempUnit)}
                    </Text>
                    <Text style={[styles.dailyTempLow, { color: colors.textMuted }]}>
                      {formatTemperature(day.tempLow, tempUnit)}
                    </Text>
                  </View>
                  <View style={styles.dailyRain}>
                    {day.precipitationProbability > 0 && (
                      <>
                        <Ionicons name="water" size={12} color={colors.info} />
                        <Text style={[styles.dailyRainText, { color: colors.textMuted }]}>
                          {day.precipitationProbability}%
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={[styles.dailyDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {capitalizeWords(day.description)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                <Text style={{ color: colors.textMuted, fontSize: FontSizes.md }}>
                  No forecast data available
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader title="Weather Details" colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }} />
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View key={m.label} style={{ width: '48%' }}>
                <WeatherMetric icon={m.icon as keyof typeof Ionicons.glyphMap} label={m.label} value={m.value} colors={metricColors} />
              </View>
            ))}
          </View>
        </View>

        {aiSummary && (
          <View style={{ marginTop: Spacing.xxl }}>
            <SectionHeader title="AI Weather Summary" colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }} />
            <View style={[styles.aiSummaryCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}>
              <View style={styles.aiSummaryHeader}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={[styles.aiSummaryTitle, { color: colors.text }]}>Week Ahead</Text>
              </View>
              <Text style={[styles.aiSummaryText, { color: colors.textSecondary }]}>
                {aiSummary.summary}
              </Text>
              <View style={styles.aiHighlights}>
                {aiSummary.highlights.map((h, i) => (
                  <View key={i} style={[styles.aiHighlightBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.aiHighlightText, { color: colors.text }]}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  unitToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  unitText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  currentCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadows.md,
  },
  currentMain: {
    alignItems: 'center',
  },
  currentTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  currentTemp: {
    fontSize: FontSizes.display,
    fontWeight: '800',
  },
  currentDescription: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  currentFeelsLike: {
    fontSize: FontSizes.md,
  },
  dailyContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dailyDayName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    width: 48,
  },
  dailyTemps: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: 72,
  },
  dailyTempHigh: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  dailyTempLow: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  dailyRain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 48,
  },
  dailyRainText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  dailyDesc: {
    flex: 1,
    fontSize: FontSizes.sm,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  aiSummaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiSummaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  aiSummaryText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  aiHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  aiHighlightBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  aiHighlightText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
