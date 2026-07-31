import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DisasterType, AlertSeverity } from '@/types';
import type { Alert, WeatherData, NotificationPrefs } from '@/types';
import { NOTIFICATION_CONFIG, SEVERITY_LEVELS, STORAGE_KEYS } from '@/constants/config';
import type { FeedItem } from '@/constants/mockData';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CATEGORY_IDS: Record<string, string> = {
  [DisasterType.EARTHQUAKE]: 'earthquake-alert',
  [DisasterType.FLOOD]: 'flood-alert',
  [DisasterType.WILDFIRE]: 'wildfire-alert',
  [DisasterType.CYCLONE]: 'cyclone-alert',
  [DisasterType.TSUNAMI]: 'tsunami-alert',
  [DisasterType.LANDSLIDE]: 'landslide-alert',
  [DisasterType.HEATWAVE]: 'heatwave-alert',
  weather: 'weather-alert',
  emergency: 'emergency-alert',
};

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.CHANNEL_ID, {
      name: NOTIFICATION_CONFIG.CHANNEL_NAME,
      description: NOTIFICATION_CONFIG.CHANNEL_DESCRIPTION,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      description: 'Critical emergency notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  sound?: boolean;
  trigger?: Notifications.NotificationTriggerInput;
}): Promise<string> {
  const categoryId = CATEGORY_IDS[params.type] ?? 'weather-alert';
  const isEmergency = params.type === 'emergency';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { ...params.data, type: params.type },
      categoryIdentifier: categoryId,
      sound: isEmergency ? 'emergency.wav' : (params.sound ?? true),
    },
    trigger: params.trigger ?? null,
  });

  return id;
}

export function handleNotificationResponse(
  callback: (type: string, data: Record<string, unknown>) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((resp) => {
    const notification = resp.notification;
    const type = (notification.request.content.data?.type as string) ?? 'unknown';
    const data = (notification.request.content.data as Record<string, unknown>) ?? {};
    callback(type, data);
  });
}

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS[DisasterType.EARTHQUAKE], [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'share', buttonTitle: 'Share' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS[DisasterType.FLOOD], [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'evacuation', buttonTitle: 'Evacuation Routes' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS[DisasterType.WILDFIRE], [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'evacuation', buttonTitle: 'Evacuation Routes' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS[DisasterType.CYCLONE], [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'shelter', buttonTitle: 'Find Shelter' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.weather, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'dismiss', buttonTitle: 'Dismiss' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.emergency, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'call', buttonTitle: 'Call Emergency' },
  ]);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================================
// Notification pipeline
// ============================================================

export async function initializeNotifications(): Promise<void> {
  try {
    await registerForPushNotifications();
    await setupNotificationCategories();
  } catch (err) {
    console.warn('Notification initialization failed:', err);
  }
}

async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-fatal
  }
}

export async function sendNotification(params: {
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  sound?: boolean;
}): Promise<string | null> {
  try {
    return await scheduleLocalNotification({
      title: params.title,
      body: params.body,
      type: params.type,
      data: params.data,
      sound: params.sound,
      trigger: null,
    });
  } catch (err) {
    console.warn('Failed to send notification:', err);
    return null;
  }
}

// ------------------------------------------------------------
// Weather notifications
// ------------------------------------------------------------

interface WeatherSnapshot {
  main: string;
  temperature: number;
  windSpeed: number;
  uvIndex: number;
  precip: number;
  weatherAlerts: string[];
}

function toWeatherSnapshot(weather: WeatherData): WeatherSnapshot {
  return {
    main: weather.current.main,
    temperature: Math.round(weather.current.temperature),
    windSpeed: Math.round(weather.current.windSpeed * 3.6),
    uvIndex: weather.current.uvIndex,
    precip: Math.round(weather.hourly?.[0]?.precipitationProbability ?? 0),
    weatherAlerts: (weather.alerts ?? []).map((a) => a.event),
  };
}

export async function checkWeatherNotifications(
  weather: WeatherData,
  prefs: NotificationPrefs
): Promise<void> {
  if (!prefs.weatherAlerts) return;

  const snapshot = toWeatherSnapshot(weather);
  const prev = await loadJSON<WeatherSnapshot>(STORAGE_KEYS.LAST_WEATHER_SNAPSHOT);

  if (!prev) {
    await saveJSON(STORAGE_KEYS.LAST_WEATHER_SNAPSHOT, snapshot);
    return;
  }

  const newWeatherAlerts = snapshot.weatherAlerts.filter((e) => !prev.weatherAlerts.includes(e));
  const reasons: string[] = [];

  if (snapshot.main !== prev.main) {
    reasons.push(`Conditions now ${snapshot.main.toLowerCase()}`);
  }
  if (Math.abs(snapshot.temperature - prev.temperature) >= 3) {
    reasons.push(`Temperature ${snapshot.temperature}°C (was ${prev.temperature}°C)`);
  }
  if (snapshot.windSpeed - prev.windSpeed >= 15) {
    reasons.push(`Wind gusting to ${snapshot.windSpeed} km/h`);
  }
  if (snapshot.precip > 30 && prev.precip <= 30) {
    reasons.push('Rain expected soon');
  }
  if (snapshot.uvIndex >= 6 && Math.floor(snapshot.uvIndex / 3) !== Math.floor(prev.uvIndex / 3)) {
    reasons.push(`UV index now ${snapshot.uvIndex}`);
  }
  for (const alertEvent of newWeatherAlerts) {
    reasons.push(`Weather alert: ${alertEvent}`);
  }

  if (reasons.length > 0) {
    const urgent = newWeatherAlerts.length > 0 || snapshot.main !== prev.main;
    const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_WEATHER_NOTIF);
    if (urgent || !lastSent || Date.now() - Number(lastSent) > 10 * 60 * 1000) {
      await sendNotification({
        title: 'Weather Update',
        body: reasons.slice(0, 2).join(' · '),
        type: 'weather',
      });
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_WEATHER_NOTIF, String(Date.now()));
    }
  }

  await saveJSON(STORAGE_KEYS.LAST_WEATHER_SNAPSHOT, snapshot);
}

// ------------------------------------------------------------
// Global feed notifications
// ------------------------------------------------------------

export async function checkFeedNotifications(feed: FeedItem[]): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.SEEN_FEED_IDS);

  if (stored == null) {
    await AsyncStorage.setItem(STORAGE_KEYS.SEEN_FEED_IDS, JSON.stringify(feed.map((f) => f.id)));
    return;
  }

  let seen: string[] = [];
  try {
    seen = JSON.parse(stored);
  } catch {
    seen = [];
  }

  const newItems = feed.filter((f) => !seen.includes(f.id));
  if (newItems.length === 0) return;

  const ids = Array.from(new Set([...seen, ...newItems.map((f) => f.id)]));
  await AsyncStorage.setItem(STORAGE_KEYS.SEEN_FEED_IDS, JSON.stringify(ids));

  if (newItems.length === 1) {
    const item = newItems[0];
    await sendNotification({
      title: item.title,
      body: `${item.location} · ${item.severity}`,
      type: item.type,
      data: { feedId: item.id, type: item.type },
    });
  } else {
    await sendNotification({
      title: 'Global Feed',
      body: `${newItems.length} new disaster events reported worldwide`,
      type: 'feed',
      data: { type: 'feed' },
    });
  }
}

// ------------------------------------------------------------
// Alert notifications
// ------------------------------------------------------------

function alertPrefEnabled(type: string, prefs: NotificationPrefs): boolean {
  switch (type) {
    case 'weather':
    case 'air_quality':
      return prefs.weatherAlerts;
    case DisasterType.EARTHQUAKE:
      return prefs.earthquakes;
    case DisasterType.FLOOD:
      return prefs.floods;
    case DisasterType.WILDFIRE:
      return prefs.wildfires;
    case DisasterType.CYCLONE:
    case DisasterType.TSUNAMI:
    case DisasterType.LANDSLIDE:
    case DisasterType.HEATWAVE:
      return prefs.storms;
    default:
      return true;
  }
}

export async function checkAlertNotifications(
  alerts: Alert[],
  prefs: NotificationPrefs
): Promise<void> {
  const relevant = alerts.filter((a) => {
    if (a.isDismissed) return false;
    const level = SEVERITY_LEVELS[a.severity];
    if (!level || !level.notification) return false;
    if (a.severity === AlertSeverity.EMERGENCY && !prefs.emergencyBroadcasts) return false;
    return alertPrefEnabled(a.type, prefs);
  });

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.SEEN_ALERT_IDS);

  if (stored == null) {
    await AsyncStorage.setItem(STORAGE_KEYS.SEEN_ALERT_IDS, JSON.stringify(relevant.map((a) => a.id)));
    return;
  }

  let seen: string[] = [];
  try {
    seen = JSON.parse(stored);
  } catch {
    seen = [];
  }

  const newAlerts = relevant.filter((a) => !seen.includes(a.id));
  if (newAlerts.length === 0) return;

  const ids = Array.from(new Set([...seen, ...newAlerts.map((a) => a.id)]));
  await AsyncStorage.setItem(STORAGE_KEYS.SEEN_ALERT_IDS, JSON.stringify(ids));

  for (const alert of newAlerts.slice(0, 5)) {
    const level = SEVERITY_LEVELS[alert.severity];
    await sendNotification({
      title: `${alert.title}`,
      body: alert.message,
      type: alert.type,
      data: { alertId: alert.id, type: alert.type },
      sound: level.soundEnabled,
    });
  }
}
