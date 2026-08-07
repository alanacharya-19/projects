import { AlertSeverity, DisasterType } from '@/types';

export function formatTemperature(temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  if (unit === 'fahrenheit') {
    return `${Math.round(temp * 9 / 5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

export function formatDate(date: string | number | Date, format: 'short' | 'long' | 'time' | 'relative' = 'short'): string {
  const d = new Date(date);

  if (format === 'relative') return getRelativeTime(d);
  if (format === 'time') return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (format === 'long') {
    return d.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(Math.abs(diff) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const suffix = diff > 0 ? 'ago' : 'from now';

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ${suffix}`;
  if (hours < 24) return `${hours}h ${suffix}`;
  if (days < 7) return `${days}d ${suffix}`;
  return formatDate(date, 'short');
}

export function getWeatherIcon(condition: string): string {
  const map: Record<string, string> = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Smoke: '🌫️',
    Haze: '🌫️', Dust: '🌫️', Fog: '🌫️', Sand: '🌫️',
    Ash: '🌫️', Squall: '💨', Tornado: '🌪️',
  };
  return map[condition] ?? '🌤️';
}

export function getSeverityColor(severity: AlertSeverity): string {
  const map: Record<AlertSeverity, string> = {
    [AlertSeverity.MINOR]: '#3B82F6',
    [AlertSeverity.MODERATE]: '#F59E0B',
    [AlertSeverity.SEVERE]: '#F97316',
    [AlertSeverity.EXTREME]: '#DC2626',
    [AlertSeverity.EMERGENCY]: '#7C2D12',
  };
  return map[severity];
}

export function getDisasterEmoji(type: DisasterType): string {
  const map: Record<DisasterType, string> = {
    [DisasterType.EARTHQUAKE]: '🌍',
    [DisasterType.FLOOD]: '🌊',
    [DisasterType.WILDFIRE]: '🔥',
    [DisasterType.CYCLONE]: '🌀',
    [DisasterType.TSUNAMI]: '🌊',
    [DisasterType.LANDSLIDE]: '⛰️',
    [DisasterType.HEATWAVE]: '🌡️',
    [DisasterType.COLD_WAVE]: '🥶',
    [DisasterType.DROUGHT]: '☀️',
    [DisasterType.VOLCANIC]: '🌋',
  };
  return map[type];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function isNightTime(sunrise: number, sunset: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now < sunrise || now > sunset;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
