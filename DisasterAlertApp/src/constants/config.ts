import { AlertSeverity } from '../types';

export const APP_CONFIG = {
  NAME: 'AlertGuard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Real-time weather & disaster alert application',
} as const;

export const DEFAULT_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
  name: 'New Delhi, India',
} as const;

export const REFRESH_INTERVALS = {
  WEATHER: 10 * 60 * 1000,         // 10 minutes
  DISASTER: 5 * 60 * 1000,         // 5 minutes
  RADAR: 2 * 60 * 1000,            // 2 minutes
  AIR_QUALITY: 30 * 60 * 1000,     // 30 minutes
  LOCATION: 5 * 60 * 1000,         // 5 minutes
} as const;

export const ALERT_DEFAULTS = {
  RADIUS_KM: 50,
  MAX_RADIUS_KM: 500,
  MIN_RADIUS_KM: 5,
  SEVERITY_THRESHOLD: AlertSeverity.MODERATE,
  MAX_ACTIVE_ALERTS: 50,
  HISTORY_RETENTION_DAYS: 30,
} as const;

export const SEVERITY_LEVELS = {
  [AlertSeverity.MINOR]: {
    label: 'Minor',
    color: '#3B82F6',
    priority: 1,
    notification: false,
    soundEnabled: false,
  },
  [AlertSeverity.MODERATE]: {
    label: 'Moderate',
    color: '#F59E0B',
    priority: 2,
    notification: true,
    soundEnabled: false,
  },
  [AlertSeverity.SEVERE]: {
    label: 'Severe',
    color: '#F97316',
    priority: 3,
    notification: true,
    soundEnabled: true,
  },
  [AlertSeverity.EXTREME]: {
    label: 'Extreme',
    color: '#DC2626',
    priority: 4,
    notification: true,
    soundEnabled: true,
  },
  [AlertSeverity.EMERGENCY]: {
    label: 'Emergency',
    color: '#7C2D12',
    priority: 5,
    notification: true,
    soundEnabled: true,
  },
} as const;

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 3,
  MAX_ZOOM: 18,
  MARKER_CLUSTER_THRESHOLD: 10,
  ANIMATION_DURATION: 300,
} as const;

export const STORAGE_KEYS = {
  USER_SETTINGS: '@alertguard/user_settings',
  SAVED_LOCATIONS: '@alertguard/saved_locations',
  EMERGENCY_CONTACTS: '@alertguard/emergency_contacts',
  ALERT_HISTORY: '@alertguard/alert_history',
  ONBOARDING_COMPLETED: '@alertguard/onboarding',
  LAST_KNOWN_LOCATION: '@alertguard/last_location',
  THEME: '@alertguard/theme',
  LAST_WEATHER_SNAPSHOT: '@geoalert/last_weather_snapshot',
  LAST_WEATHER_NOTIF: '@geoalert/last_weather_notif',
  SEEN_FEED_IDS: '@geoalert/seen_feed_ids',
  SEEN_ALERT_IDS: '@geoalert/seen_alert_ids',
  USER_NAME: '@geoalert/user_name',
} as const;

export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'alertguard-alerts',
  CHANNEL_NAME: 'Weather & Disaster Alerts',
  CHANNEL_DESCRIPTION: 'Notifications for weather and disaster alerts',
  DEFAULT_IMPORTANCE: 'high' as const,
  BADGE_COUNT: 99,
} as const;
