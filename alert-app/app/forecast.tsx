import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { useWeather } from '@/hooks/useWeather';
import type { HourlyForecast, DailyForecast } from '@/types';

const SCREEN_W = Dimensions.get('window').width;

function getWeatherIcon(code: string): number {
  const map: Record<string, number> = {
    '01d': require('../assets/icons/sunny.png'),
    '01n': require('../assets/icons/sunny.png'),
    '02d': require('../assets/icons/partly-sunny.png'),
    '02n': require('../assets/icons/partly-sunny.png'),
    '03d': require('../assets/icons/cloudy.png'),
    '03n': require('../assets/icons/cloudy.png'),
    '04d': require('../assets/icons/cloudy.png'),
    '04n': require('../assets/icons/cloudy.png'),
    '09d': require('../assets/icons/rainy.png'),
    '09n': require('../assets/icons/rainy.png'),
    '10d': require('../assets/icons/rainy.png'),
    '10n': require('../assets/icons/rainy.png'),
    '11d': require('../assets/icons/thunderstorm.png'),
    '11n': require('../assets/icons/thunderstorm.png'),
    '13d': require('../assets/icons/snowing.png'),
    '13n': require('../assets/icons/snowing.png'),
  };
  return map[code] || require('../assets/icons/sunny.png');
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

function capitalizeWords(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, updateSettings } = useAppContext();
  const { isLoading, refresh, hourlyForecast, dailyForecast, uvIndex, airQuality } = useWeather();
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

  const weather = state.weather;

  const currentSummary = useMemo(() => {
    if (!weather) return null;
    const { current } = weather;
    return {
      temp: isCelsius ? `${Math.round(current.temperature)}°C` : `${Math.round(current.temperature * 9 / 5 + 32)}°F`,
      feelsLike: isCelsius ? `${Math.round(current.feelsLike)}°` : `${Math.round(current.feelsLike * 9 / 5 + 32)}°`,
      description: capitalizeWords(current.description),
      icon: current.icon,
      high: dailyForecast.length > 0
        ? (isCelsius ? `${Math.round(dailyForecast[0].tempHigh)}°` : `${Math.round(dailyForecast[0].tempHigh * 9 / 5 + 32)}°`)
        : null,
      low: dailyForecast.length > 0
        ? (isCelsius ? `${Math.round(dailyForecast[0].tempLow)}°` : `${Math.round(dailyForecast[0].tempLow * 9 / 5 + 32)}°`)
        : null,
    };
  }, [weather, isCelsius, dailyForecast]);

  const formatTemp = (t: number) => isCelsius ? Math.round(t) : Math.round(t * 9 / 5 + 32);

  if (isLoading && !weather) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#DDEEFF', '#F8FBFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
        <View style={styles.center}>
          <Image source={require('../assets/icons/weather.png')} style={styles.loadingIcon} />
          <Text style={styles.loadingText}>Loading forecast...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DDEEFF', '#F8FBFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weather Forecast</Text>
          <TouchableOpacity style={styles.unitToggle} onPress={toggleUnit} activeOpacity={0.7}>
            <Text style={[styles.unitText, isCelsius && styles.unitActive]}>{'\u00B0'}C</Text>
            <Text style={[styles.unitDivider]}>|</Text>
            <Text style={[styles.unitText, !isCelsius && styles.unitActive]}>{'\u00B0'}F</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        {currentSummary && (
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#4F8EF7', '#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGrad}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroTemp}>{currentSummary.temp}</Text>
                  <Text style={styles.heroDesc}>{currentSummary.description}</Text>
                  <Text style={styles.heroFeels}>
                    Feels like {currentSummary.feelsLike} {'\u00B7'} H:{currentSummary.high} L:{currentSummary.low}
                  </Text>
                </View>
                <Image source={getWeatherIcon(currentSummary.icon)} style={styles.heroIcon} />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Hourly Forecast */}
        <View style={styles.contentPad}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyContent}
          >
            {hourlyForecast.length > 0 ? (
              (hourlyForecast.filter((h) => isToday(h.time)).length > 0
                ? hourlyForecast.filter((h) => isToday(h.time))
                : hourlyForecast.slice(0, 24)
              ).map((h: HourlyForecast) => {
                const now = isNow(h.time);
                return (
                  <View key={h.time} style={[styles.hourlyCard, now && styles.hourlyCardActive]}>
                    <Text style={[styles.hourlyTime, now && styles.hourlyTimeActive]}>
                      {now ? 'Now' : formatHour(h.time)}
                    </Text>
                    <Image source={getWeatherIcon(h.icon)} style={styles.hourlyIcon} />
                    <Text style={[styles.hourlyTemp, now && styles.hourlyTempActive]}>
                      {formatTemp(h.temperature)}{'\u00B0'}
                    </Text>
                    {h.precipitationProbability > 0 && (
                      <View style={styles.rainBadge}>
                        <Ionicons name="water" size={8} color={now ? '#FFFFFF' : '#3B82F6'} />
                        <Text style={[styles.rainText, now && styles.rainTextActive]}>
                          {h.precipitationProbability}%
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No hourly data available</Text>
              </View>
            )}
          </ScrollView>

          {/* 7-Day Forecast */}
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyList}>
            {dailyForecast.length > 0 ? (
              dailyForecast.map((day: DailyForecast, idx: number) => (
                <View key={day.date} style={styles.dailyCard}>
                  <View style={styles.dailyTop}>
                    <Text style={[styles.dailyDay, idx === 0 && styles.dailyToday]}>
                      {idx === 0 ? 'Today' : day.dayName}
                    </Text>
                    <Text style={styles.dailyDate}>{day.date}</Text>
                  </View>
                  <Image source={getWeatherIcon(day.icon)} style={styles.dailyIcon} />
                  <Text style={styles.dailyDesc} numberOfLines={2}>{capitalizeWords(day.description)}</Text>
                  <View style={styles.dailyTempRow}>
                    <Text style={styles.dailyLow}>{formatTemp(day.tempLow)}{'\u00B0'}</Text>
                    <Text style={styles.dailyHigh}>{formatTemp(day.tempHigh)}{'\u00B0'}</Text>
                  </View>
                  <View style={styles.dailyBar}>
                    <View style={[styles.dailyBarFill, { width: `${Math.min(((day.tempHigh - day.tempLow) / 20) * 100, 100)}%` }]} />
                  </View>
                  <View style={styles.dailyMeta}>
                    <View style={styles.dailyMetaItem}>
                      <Image source={require('../assets/icons/humidity.png')} style={styles.dailyMetaIcon} />
                      <Text style={styles.dailyMetaText}>{day.humidity}%</Text>
                    </View>
                    <View style={styles.dailyMetaItem}>
                      <Ionicons name="water" size={11} color="#3B82F6" />
                      <Text style={styles.dailyMetaText}>{day.precipitationProbability}%</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No forecast data available</Text>
              </View>
            )}
          </ScrollView>

          {/* Weather Details */}
          <Text style={styles.sectionTitle}>Weather Details</Text>
          <View style={styles.detailsGrid}>
            {weather && (
              <>
                <DetailCard icon={require('../assets/icons/humidity.png')} label="Humidity" value={`${weather.current.humidity}%`} />
                <DetailCard icon={require('../assets/icons/wind.png')} label="Wind" value={`${weather.current.windSpeed} m/s`} />
                <DetailCard icon={require('../assets/icons/precipitation.png')} label="Precip." value={`${weather.hourly?.[0]?.precipitationProbability ?? 0}%`} />
                <DetailCard icon={require('../assets/icons/visibility.png')} label="Visibility" value={`${(weather.current.visibility / 1000).toFixed(0)} km`} />
              </>
            )}
            <DetailCard icon={require('../assets/icons/uvIndex.png')} label="UV Index" value={uvIndex != null ? `${uvIndex}` : 'N/A'} />
            <DetailCard icon={require('../assets/icons/airQuality.png')} label="Air Quality" value={airQuality ? airQuality.description : 'N/A'} />
            <DetailCard icon={require('../assets/icons/sunrise.png')} label="Sunrise" value={weather ? new Date(weather.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} />
            <DetailCard icon={require('../assets/icons/sunset.png')} label="Sunset" value={weather ? new Date(weather.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} />
          </View>

          {/* AI Summary */}
          {dailyForecast.length > 0 && <AISummaryCard dailyForecast={dailyForecast} isCelsius={isCelsius} />}
        </View>
      </ScrollView>
    </View>
  );
}

function AISummaryCard({ dailyForecast, isCelsius }: { dailyForecast: DailyForecast[]; isCelsius: boolean }) {
  const high = Math.max(...dailyForecast.map((d) => d.tempHigh));
  const low = Math.min(...dailyForecast.map((d) => d.tempLow));
  const rainyDays = dailyForecast.filter((d) => d.precipitationProbability > 50).length;
  const fmt = (t: number) => isCelsius ? `${Math.round(t)}°C` : `${Math.round(t * 9 / 5 + 32)}°F`;

  return (
    <LinearGradient
      colors={['#6366F1', '#4F46E5', '#4338CA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.aiCard}
    >
      <View style={styles.aiHeader}>
        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        <Text style={styles.aiTitle}>AI Weather Summary</Text>
      </View>
      <Text style={styles.aiText}>
        The week ahead shows highs of {fmt(high)} and lows of {fmt(low)}. {rainyDays > 0 ? `${rainyDays} day(s) with significant rain expected.` : 'Mostly dry conditions expected.'}
      </Text>
      <View style={styles.aiChips}>
        {[
          `High: ${fmt(high)}`,
          `Low: ${fmt(low)}`,
          `Rain: ${rainyDays > 0 ? `${rainyDays}d` : 'Minimal'}`,
        ].map((h, i) => (
          <View key={i} style={styles.aiChip}>
            <Text style={styles.aiChipText}>{h}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

function DetailCard({ icon, label, value }: { icon: number; label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Image source={icon} style={styles.detailIcon} />
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingIcon: { width: 48, height: 48, opacity: 0.5 },
  loadingText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  unitActive: {
    color: '#3B82F6',
  },
  unitDivider: {
    fontSize: 13,
    color: '#D1D8E0',
  },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGrad: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  heroTemp: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -3,
  },
  heroDesc: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  heroFeels: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  heroIcon: {
    width: 120,
    height: 120,
    marginRight: -10,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2332',
    marginTop: 24,
    marginBottom: 14,
  },
  hourlyContent: {
    gap: 10,
    paddingVertical: 2,
  },
  hourlyCard: {
    width: 68,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    gap: 6,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  hourlyCardActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  hourlyTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  hourlyTimeActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  hourlyIcon: {
    width: 28,
    height: 28,
  },
  hourlyTemp: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  hourlyTempActive: {
    color: '#FFFFFF',
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  rainText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#3B82F6',
  },
  rainTextActive: {
    color: '#FFFFFF',
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dailyList: {
    gap: 10,
    paddingVertical: 2,
  },
  dailyCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dailyTop: {
    alignItems: 'center',
  },
  dailyDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dailyToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  dailyDate: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    marginTop: 4,
  },
  dailyDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    height: 30,
  },
  dailyTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyLow: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dailyBar: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  dailyBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  dailyHigh: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dailyMeta: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    justifyContent: 'center',
  },
  dailyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dailyMetaIcon: {
    width: 12,
    height: 12,
  },
  dailyMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailCard: {
    width: (SCREEN_W - 40 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailIcon: {
    width: 28,
    height: 28,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  aiChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
