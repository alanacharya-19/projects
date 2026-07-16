import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getCurrentLocation, watchPosition, hasLocationPermission } from '@/services/locationService';
import type { UserLocation } from '@/types';

interface UseLocationReturn {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationReturn {
  const { state, updateLocation } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchRef = useRef<{ remove: () => void } | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await hasLocationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      updateLocation(loc);
      setPermissionGranted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, [updateLocation]);

  useEffect(() => {
    fetchLocation();
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    watchRef.current = watchPosition(
      (loc: UserLocation) => updateLocation(loc),
      (err: Error) => setError(err.message)
    );

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, [permissionGranted, updateLocation]);

  return {
    location: state.location,
    isLoading,
    error,
    permissionGranted,
    refresh: fetchLocation,
    requestPermission,
  };
}
