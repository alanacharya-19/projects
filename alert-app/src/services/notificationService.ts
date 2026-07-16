import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { DisasterType } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CATEGORY_IDS: Record<DisasterType | 'emergency', string> = {
  weather: 'weather-alert',
  earthquake: 'earthquake-alert',
  flood: 'flood-alert',
  wildfire: 'wildfire-alert',
  storm: 'storm-alert',
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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
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
  type: DisasterType | 'emergency';
  data?: Record<string, unknown>;
  trigger?: Notifications.NotificationTriggerInput;
}): Promise<string> {
  const categoryId = params.type === 'emergency' ? CATEGORY_IDS.emergency : CATEGORY_IDS[params.type];
  const channelId = params.type === 'emergency' ? 'emergency' : 'default';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { ...params.data, type: params.type },
      categoryIdentifier: categoryId,
      sound: params.type === 'emergency' ? 'emergency.wav' : true,
      ...(Platform.OS === 'android' && { priority: 'max' }),
    },
    trigger: params.trigger ?? null,
  });

  return id;
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
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
  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.weather, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'dismiss', buttonTitle: 'Dismiss' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.earthquake, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'share', buttonTitle: 'Share' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.flood, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'evacuation', buttonTitle: 'Evacuation Routes' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.wildfire, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'evacuation', buttonTitle: 'Evacuation Routes' },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_IDS.storm, [
    { identifier: 'view', buttonTitle: 'View Details' },
    { identifier: 'shelter', buttonTitle: 'Find Shelter' },
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
