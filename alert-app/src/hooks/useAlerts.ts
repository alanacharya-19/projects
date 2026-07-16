import { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAlertContext } from '@/context/AlertContext';
import { fetchEarthquakes, fetchFloodData, fetchWildfires, fetchStormData } from '@/services/disasterService';
import { calculateDistance } from '@/services/locationService';
import type { DisasterAlert } from '@/types';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

interface UseAlertsReturn {
  alerts: DisasterAlert[];
  filteredAlerts: DisasterAlert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  const { state, setAlerts, addAlerts } = useAppContext();
  const { filteredAlerts, unreadCount, addAlert, setFilter, filters } = useAlertContext();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const loc = state.location;
    if (!loc) return;

    try {
      const bbox = {
        minLat: loc.latitude - 2,
        minLon: loc.longitude - 2,
        maxLat: loc.latitude + 2,
        maxLon: loc.longitude + 2,
      };

      const results = await Promise.allSettled([
        fetchEarthquakes(bbox),
        fetchFloodData(loc),
        fetchWildfires(bbox),
        fetchStormData(loc),
      ]);

      const allAlerts: DisasterAlert[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allAlerts.push(...result.value);
        }
      }

      const withDistance = allAlerts.map((alert) => ({
        ...alert,
        distance: calculateDistance(
          loc.latitude,
          loc.longitude,
          alert.location.latitude,
          alert.location.longitude
        ),
      }));

      withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      setAlerts(withDistance);
    } catch (err) {
      // Errors are non-fatal for alerts; keep existing state
    }
  }, [state.location, setAlerts]);

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

  const isLoading = state.isLoadingAlerts;

  return {
    alerts: state.alerts,
    filteredAlerts,
    unreadCount,
    isLoading,
    error: state.alertError,
    refresh,
  };
}
