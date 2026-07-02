import { useState, useEffect, useCallback } from 'react';
import { requestAudioPermissions, checkAudioPermissions } from '../utils/permissions';

export function usePermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    setLoading(true);
    const result = await checkAudioPermissions();
    setHasPermission(result);
    setLoading(false);
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    const result = await requestAudioPermissions();
    setHasPermission(result);
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return { hasPermission, loading, requestPermission, checkPermission };
}
