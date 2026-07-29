import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
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
  return (
    <View style={styles.cardOuter}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            <Text style={styles.label}>Today&apos;s Weather</Text>
            <View style={styles.tempRow}>
              <Text style={styles.temp}>
                {weather ? `${Math.round(weather.current.temperature)}\u00B0` : '--\u00B0'}
                <Text style={styles.unit}>C</Text>
              </Text>
              <Text style={styles.desc}>{getWeatherEmoji(weather?.current.icon || '01d')} {weather?.current.main || 'Loading...'}</Text>
            </View>
            <Text style={styles.feels}>
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
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>{weather ? `${weather.current.humidity}%` : '--'}</Text>
            </View>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/wind.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statValue}>{weather ? `${Math.round(weather.current.windSpeed)}km/h` : '--'}</Text>
            </View>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/precipitation.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Precip.</Text>
              <Text style={styles.statValue}>{weather ? `${weather.hourly?.[0]?.precipitationProbability ?? 0}%` : '--'}</Text>
            </View>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Image source={require('../../assets/icons/visibility.png')} style={styles.statIcon} />
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Visibility</Text>
              <Text style={styles.statValue}>{weather ? `${(weather.current.visibility / 1000).toFixed(0)}km` : '--'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomDiv} />
        <View style={styles.sunRow}>
          <View style={styles.sunItem}>
            <Image source={require('../../assets/icons/sunrise.png')} style={styles.sunIcon} />
            <View>
              <Text style={styles.sunLabel}>Sunrise</Text>
              <Text style={styles.sunValue}>{weather ? formatTime(weather.current.sunrise) : '--'}</Text>
            </View>
          </View>
          <View style={styles.sunDiv} />
          <View style={styles.sunItem}>
            <Image source={require('../../assets/icons/sunset.png')} style={styles.sunIcon} />
            <View>
              <Text style={styles.sunLabel}>Sunset</Text>
              <Text style={styles.sunValue}>{weather ? formatTime(weather.current.sunset) : '--'}</Text>
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
    shadowColor: '#B0BEC5',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    backgroundColor: '#F0F4F8',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -8, height: -8 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
