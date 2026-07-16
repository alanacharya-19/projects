import React, { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import type { DisasterAlert, AlertSeverity, DisasterType } from '@/types';

interface AlertFilter {
  types: DisasterType[];
  severities: AlertSeverity[];
  maxDistance?: number;
}

interface AlertState {
  alerts: DisasterAlert[];
  filters: AlertFilter;
  unreadCount: number;
}

type AlertAction =
  | { type: 'SET_ALERTS'; payload: DisasterAlert[] }
  | { type: 'ADD_ALERT'; payload: DisasterAlert }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'SET_FILTER'; payload: Partial<AlertFilter> };

const defaultFilter: AlertFilter = {
  types: ['earthquake', 'flood', 'wildfire', 'storm'],
  severities: ['moderate', 'high', 'extreme'],
};

function computeUnread(alerts: DisasterAlert[]): number {
  return alerts.filter((a) => a.status === 'unread' && a.status !== 'dismissed').length;
}

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'SET_ALERTS': {
      const alerts = action.payload;
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'ADD_ALERT': {
      const exists = state.alerts.some((a) => a.id === action.payload.id);
      if (exists) return state;
      const alerts = [action.payload, ...state.alerts];
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'DISMISS_ALERT': {
      const alerts = state.alerts.map((a) =>
        a.id === action.payload ? { ...a, status: 'dismissed' as const } : a
      );
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'MARK_AS_READ': {
      const alerts = state.alerts.map((a) =>
        a.id === action.payload && a.status === 'unread' ? { ...a, status: 'read' as const } : a
      );
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'MARK_ALL_READ': {
      const alerts = state.alerts.map((a) =>
        a.status === 'unread' ? { ...a, status: 'read' as const } : a
      );
      return { ...state, alerts, unreadCount: 0 };
    }
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    default:
      return state;
  }
}

interface AlertContextValue {
  alerts: DisasterAlert[];
  filteredAlerts: DisasterAlert[];
  filters: AlertFilter;
  unreadCount: number;
  addAlert: (alert: DisasterAlert) => void;
  dismissAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setFilter: (filter: Partial<AlertFilter>) => void;
  setAlerts: (alerts: DisasterAlert[]) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(alertReducer, {
    alerts: [],
    filters: defaultFilter,
    unreadCount: 0,
  });

  const filteredAlerts = useMemo(() => {
    return state.alerts.filter((alert) => {
      if (alert.status === 'dismissed') return false;
      if (!state.filters.types.includes(alert.type)) return false;
      if (!state.filters.severities.includes(alert.severity)) return false;
      if (state.filters.maxDistance && alert.distance && alert.distance > state.filters.maxDistance) return false;
      return true;
    });
  }, [state.alerts, state.filters]);

  const addAlert = useCallback((alert: DisasterAlert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_ALERT', payload: id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const setFilter = useCallback((filter: Partial<AlertFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setAlerts = useCallback((alerts: DisasterAlert[]) => {
    dispatch({ type: 'SET_ALERTS', payload: alerts });
  }, []);

  const value = useMemo<AlertContextValue>(
    () => ({
      alerts: state.alerts,
      filteredAlerts,
      filters: state.filters,
      unreadCount: state.unreadCount,
      addAlert,
      dismissAlert,
      markAsRead,
      markAllRead,
      setFilter,
      setAlerts,
    }),
    [state.alerts, filteredAlerts, state.filters, state.unreadCount, addAlert, dismissAlert, markAsRead, markAllRead, setFilter, setAlerts]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlertContext(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlertContext must be used within AlertProvider');
  return ctx;
}
