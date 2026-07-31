import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { WeatherData } from '@/types';

interface WeatherCardProps {
  weather: WeatherData | null;
}

function getWeatherIcon(code: string): number {
  const iconMap: Record<string, number> = {
    '01d': require('../../assets/icons/sunny.png'),
    '01n': require('../../assets/icons/sunny.png'),
    '02d': require('../../assets/icons/partly-sunny.png'),
    '02n': require('../../assets/icons/partly-sunny.png'),
    '03d': require('../../assets/icons/cloudy.png'),
    '03n': require('../../assets/icons/cloudy.png'),
    '04d': require('../../assets/icons/cloudy.png'),
    '04n': require('../../assets/icons/cloudy.png'),
    '09d': require('../../assets/icons/rainy.png'),
    '09n': require('../../assets/icons/rainy.png'),
    '10d': require('../../assets/icons/rainy.png'),
    '10n': require('../../assets/icons/rainy.png'),
    '11d': require('../../assets/icons/thunderstorm.png'),
    '11n': require('../../assets/icons/thunderstorm.png'),
    '13d': require('../../assets/icons/snowing.png'),
    '13n': require('../../assets/icons/snowing.png'),
  };
  return iconMap[code] || require('../../assets/icons/sunny.png');
}

function getWeatherEmoji(code: string): string {
  if (code.startsWith('01')) return '\u2600\uFE0F';
  if (code.startsWith('02')) return '\u26C5';
  if (code.startsWith('03') || code.startsWith('04')) return '\u2601\uFE0F';
  if (code.startsWith('09') || code.startsWith('10')) return '\uD83C\uDF27\uFE0F';
  if (code.startsWith('11')) return '\u26C8\uFE0F';
  if (code.startsWith('13')) return '\u2744\uFE0F';
  return '\uD83C\uDF24\uFE0F';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.cardOuter}>
      <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Today&apos;s Weather</Text>
            <View style={styles.tempRow}>
              <Text style={[styles.temp, { color: colors.text }]}>
                {weather ? `${Math.round(weather.current.temperature)}\u00B0` : '--\u00B0'}
                <Text style={[styles.unit, { color: colors.textMuted }]}>C</Text>
              </Text>
              <Text style={styles.desc}>{getWeatherEmoji(weather?.current.icon || '01d')} {weather?.current.main || 'Loading...'}</Text>
            </View>
            <Text style={[styles.feels, { color: colors.textMuted }]}>
              Feels like {weather ? `${Math.round(weather.current.feelsLike)}\u00B0` : '--'}
            </Text>
          </View>
          <View style={styles.stickerWrap}>
            <Image source={getWeatherIcon(weather?.current.icon || '01d')} style={styles.sticker} />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/humidity.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Humidity</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{weather ? `${weather.current.humidity}%` : '--'}</Text>
            </View>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/wind.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Wind</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{weather ? `${Math.round(weather.current.windSpeed)}km/h` : '--'}</Text>
            </View>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/precipitation.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Precip.</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{weather ? `${weather.hourly?.[0]?.precipitationProbability ?? 0}%` : '--'}</Text>
            </View>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/visibility.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Visibility</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{weather ? `${(weather.current.visibility / 1000).toFixed(0)}km` : '--'}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.bottomDiv, { backgroundColor: colors.divider }]} />
        <View style={styles.sunRow}>
          <View style={styles.sunItem}>
            <Image source={require('../../assets/icons/sunrise.png')} style={styles.sunIcon} />
            <View>
              <Text style={[styles.sunLabel, { color: colors.textMuted }]}>Sunrise</Text>
              <Text style={[styles.sunValue, { color: colors.text }]}>{weather ? formatTime(weather.current.sunrise) : '--'}</Text>
            </View>
          </View>
          <View style={[styles.sunDiv, { backgroundColor: colors.divider }]} />
          <View style={styles.sunItem}>
            <Image source={require('../../assets/icons/sunset.png')} style={styles.sunIcon} />
            <View>
              <Text style={[styles.sunLabel, { color: colors.textMuted }]}>Sunset</Text>
              <Text style={[styles.sunValue, { color: colors.text }]}>{weather ? formatTime(weather.current.sunset) : '--'}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginHorizontal: 20,
    marginTop: -60,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  temp: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1E293B',
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  feels: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  stickerWrap: {
    width: 170,
    height: 170,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginRight: -30,
    marginTop: -70,
  },
  sticker: {
    width: 160,
    height: 160,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  statIcon: {
    width: 16,
    height: 16,
  },
  statText: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  statDiv: {
    width: 1,
    height: '50%',
    backgroundColor: '#D1D8E0',
    marginHorizontal: 4,
  },
  bottomDiv: {
    height: 1,
    backgroundColor: '#D1D8E0',
    marginTop: 8,
  },
  sunRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  sunDiv: {
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
    color: '#94A3B8',
  },
  sunValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
});
