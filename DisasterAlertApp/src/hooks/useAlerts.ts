import { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { fetchEarthquakes, fetchFloodData, fetchWildfires, fetchStormData } from '@/services/disasterService';
import { calculateDistance } from '@/services/locationService';
import type { Alert } from '@/types';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface UseAlertsReturn {
  alerts: Alert[];
  filteredAlerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  const { state, setAlerts } = useAppContext();
  const { filteredAlerts, unreadCount, setAlerts: setAlertContextAlerts } = useAlertContext();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const loc = state.location;
    if (!loc) return;

    try {
      const bbox = {
        minLat: loc.latitude - 10,
        minLon: loc.longitude - 10,
        maxLat: loc.latitude + 10,
        maxLon: loc.longitude + 10,
      };

      const results = await Promise.allSettled([
        fetchEarthquakes(bbox),
        fetchFloodData(loc),
        fetchWildfires(bbox),
        fetchStormData(loc),
      ]);

      const allAlerts: Alert[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allAlerts.push(...result.value);
        }
      }

      const withDistance = allAlerts.map((alert) => {
        const dist = calculateDistance(
          loc.latitude, loc.longitude,
          alert.coordinates.latitude, alert.coordinates.longitude
        );
        return { ...alert, radius: dist };
      });

      withDistance.sort((a, b) => a.radius - b.radius);

      setAlerts(withDistance);
      setAlertContextAlerts(withDistance);
    } catch {
      // Non-fatal; keep existing alerts
    }
  }, [state.location, setAlerts, setAlertContextAlerts]);

  const refresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!state.location) return;
    fetchAll();
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.location, fetchAll]);

  return {
    alerts: state.alerts,
    filteredAlerts,
    unreadCount,
    isLoading: state.isLoadingAlerts,
    error: state.alertError,
    refresh,
  };
}
