import React, { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import type {
  Coordinates,
  WeatherData,
  DailyForecast,
  DisasterAlert,
  UserLocation,
  AppSettings,
  NotificationPrefs,
  AlertSeverity,
} from '@/types';

interface AppState {
  location: UserLocation | null;
  weather: WeatherData | null;
  dailyForecast: DailyForecast[];
  alerts: DisasterAlert[];
  settings: AppSettings;
  isLoadingWeather: boolean;
  isLoadingAlerts: boolean;
  weatherError: string | null;
  alertError: string | null;
}

type AppAction =
  | { type: 'SET_LOCATION'; payload: UserLocation }
  | { type: 'SET_WEATHER'; payload: WeatherData }
  | { type: 'SET_DAILY_FORECAST'; payload: DailyForecast[] }
  | { type: 'SET_WEATHER_LOADING'; payload: boolean }
  | { type: 'SET_WEATHER_ERROR'; payload: string | null }
  | { type: 'SET_ALERTS'; payload: DisasterAlert[] }
  | { type: 'ADD_ALERTS'; payload: DisasterAlert[] }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'SET_ALERTS_LOADING'; payload: boolean }
  | { type: 'SET_ALERT_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'UPDATE_NOTIFICATION_PREFS'; payload: Partial<NotificationPrefs> };

const defaultSettings: AppSettings = {
  temperatureUnit: 'celsius',
  distanceUnit: 'km',
  alertDistance: 50000,
  severityFilter: ['moderate', 'high', 'extreme'] as AlertSeverity[],
  notificationPrefs: {
    weatherAlerts: true,
    earthquakes: true,
    floods: true,
    wildfires: true,
    storms: true,
    emergencyBroadcasts: true,
  },
  theme: 'auto',
};

const initialState: AppState = {
  location: null,
  weather: null,
  dailyForecast: [],
  alerts: [],
  settings: defaultSettings,
  isLoadingWeather: false,
  isLoadingAlerts: false,
  weatherError: null,
  alertError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_WEATHER':
      return { ...state, weather: action.payload, isLoadingWeather: false, weatherError: null };
    case 'SET_DAILY_FORECAST':
      return { ...state, dailyForecast: action.payload };
    case 'SET_WEATHER_LOADING':
      return { ...state, isLoadingWeather: action.payload };
    case 'SET_WEATHER_ERROR':
      return { ...state, weatherError: action.payload, isLoadingWeather: false };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload, isLoadingAlerts: false, alertError: null };
    case 'ADD_ALERTS': {
      const existingIds = new Set(state.alerts.map((a) => a.id));
      const newAlerts = action.payload.filter((a) => !existingIds.has(a.id));
      return { ...state, alerts: [...newAlerts, ...state.alerts], isLoadingAlerts: false };
    }
    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.payload ? { ...a, status: 'dismissed' as const } : a)),
      };
    case 'SET_ALERTS_LOADING':
      return { ...state, isLoadingAlerts: action.payload };
    case 'SET_ALERT_ERROR':
      return { ...state, alertError: action.payload, isLoadingAlerts: false };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'UPDATE_NOTIFICATION_PREFS':
      return {
        ...state,
        settings: {
          ...state.settings,
          notificationPrefs: { ...state.settings.notificationPrefs, ...action.payload },
        },
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  updateLocation: (location: Coordinates & { city?: string; region?: string; country?: string }) => void;
  refreshWeather: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateNotificationPrefs: (prefs: Partial<NotificationPrefs>) => void;
  setAlerts: (alerts: DisasterAlert[]) => void;
  addAlerts: (alerts: DisasterAlert[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const updateLocation = useCallback(
    (loc: Coordinates & { city?: string; region?: string; country?: string }) => {
      dispatch({
        type: 'SET_LOCATION',
        payload: { ...loc, timestamp: Date.now() },
      });
    },
    []
  );

  const refreshWeather = useCallback(async () => {
    if (!state.location) return;
    dispatch({ type: 'SET_WEATHER_LOADING', payload: true });
    try {
      const { fetchCurrentWeather, fetchDailyForecast } = await import('@/services/weatherService');
      const [weather, daily] = await Promise.all([
        fetchCurrentWeather(state.location.latitude, state.location.longitude),
        fetchDailyForecast(state.location.latitude, state.location.longitude),
      ]);
      dispatch({ type: 'SET_WEATHER', payload: weather });
      dispatch({ type: 'SET_DAILY_FORECAST', payload: daily });
    } catch (err) {
      dispatch({ type: 'SET_WEATHER_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch weather' });
    }
  }, [state.location]);

  const dismissAlert = useCallback((alertId: string) => {
    dispatch({ type: 'DISMISS_ALERT', payload: alertId });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const updateNotificationPrefs = useCallback((prefs: Partial<NotificationPrefs>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION_PREFS', payload: prefs });
  }, []);

  const setAlerts = useCallback((alerts: DisasterAlert[]) => {
    dispatch({ type: 'SET_ALERTS', payload: alerts });
  }, []);

  const addAlerts = useCallback((alerts: DisasterAlert[]) => {
    dispatch({ type: 'ADD_ALERTS', payload: alerts });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      updateLocation,
      refreshWeather,
      dismissAlert,
      updateSettings,
      updateNotificationPrefs,
      setAlerts,
      addAlerts,
    }),
    [state, updateLocation, refreshWeather, dismissAlert, updateSettings, updateNotificationPrefs, setAlerts, addAlerts]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
