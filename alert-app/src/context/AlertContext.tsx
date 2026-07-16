import React, { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import { DisasterType, AlertSeverity } from '@/types';
import type { Alert, AlertFilter } from '@/types';

interface AlertState {
  alerts: Alert[];
  filters: AlertFilter;
  unreadCount: number;
}

type AlertAction =
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'SET_FILTER'; payload: Partial<AlertFilter> };

const defaultFilter: AlertFilter = {
  types: [DisasterType.EARTHQUAKE, DisasterType.FLOOD, DisasterType.WILDFIRE, DisasterType.CYCLONE],
  severity: [AlertSeverity.MODERATE, AlertSeverity.SEVERE, AlertSeverity.EXTREME, AlertSeverity.EMERGENCY],
};

function computeUnread(alerts: Alert[]): number {
  return alerts.filter((a) => !a.isRead && !a.isDismissed).length;
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
        a.id === action.payload ? { ...a, isDismissed: true } : a
      );
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'MARK_AS_READ': {
      const alerts = state.alerts.map((a) =>
        a.id === action.payload && !a.isRead ? { ...a, isRead: true } : a
      );
      return { ...state, alerts, unreadCount: computeUnread(alerts) };
    }
    case 'MARK_ALL_READ': {
      const alerts = state.alerts.map((a) =>
        !a.isRead ? { ...a, isRead: true } : a
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
  alerts: Alert[];
  filteredAlerts: Alert[];
  filters: AlertFilter;
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setFilter: (filter: Partial<AlertFilter>) => void;
  setAlerts: (alerts: Alert[]) => void;
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
      if (alert.isDismissed) return false;
      if (state.filters.types && !state.filters.types.includes(alert.type as DisasterType)) return false;
      if (state.filters.severity && !state.filters.severity.includes(alert.severity)) return false;
      return true;
    });
  }, [state.alerts, state.filters]);

  const addAlert = useCallback((alert: Alert) => {
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

  const setAlerts = useCallback((alerts: Alert[]) => {
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
