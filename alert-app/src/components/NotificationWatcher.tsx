import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { MOCK_FEED } from '@/constants/mockData';
import {
  initializeNotifications,
  checkWeatherNotifications,
  checkFeedNotifications,
  checkAlertNotifications,
} from '@/services/notificationService';

const FEED_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function NotificationWatcher() {
  const { state } = useAppContext();
  const { alerts } = useAlertContext();

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (!state.weather) return;
    checkWeatherNotifications(state.weather, state.settings.notificationPrefs);
  }, [state.weather, state.settings.notificationPrefs]);

  useEffect(() => {
    checkFeedNotifications(MOCK_FEED);
    const interval = setInterval(() => checkFeedNotifications(MOCK_FEED), FEED_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (alerts.length === 0) return;
    checkAlertNotifications(alerts, state.settings.notificationPrefs);
  }, [alerts, state.settings.notificationPrefs]);

  return null;
}
