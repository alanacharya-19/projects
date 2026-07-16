import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { fetchCurrentWeather, fetchDailyForecast, fetchHourlyForecast, fetchUVIndex, fetchAirQuality } from '@/services/weatherService';
import type { HourlyForecast, DailyForecast, AirQualityData } from '@/types';

interface UseWeatherReturn {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  airQuality: AirQualityData | null;
  uvIndex: number | null;
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function useWeather(): UseWeatherReturn {
  const { state, refreshWeather } = useAppContext();
  const { weather, isLoadingWeather: isLoading, weatherError: error, location } = state;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);

  const fetchExtras = useCallback(async (lat: number, lon: number) => {
    const [hourlyData, dailyData, aqData, uvData] = await Promise.allSettled([
      fetchHourlyForecast(lat, lon),
      fetchDailyForecast(lat, lon),
      fetchAirQuality(lat, lon),
      fetchUVIndex(lat, lon),
    ]);

    if (hourlyData.status === 'fulfilled') setHourly(hourlyData.value);
    if (dailyData.status === 'fulfilled') setDaily(dailyData.value);
    if (aqData.status === 'fulfilled') setAirQuality(aqData.value);
    if (uvData.status === 'fulfilled') setUvIndex(uvData.value);
  }, []);

  const refresh = useCallback(async () => {
    if (!location) return;
    await refreshWeather();
    await fetchExtras(location.latitude, location.longitude);
  }, [location, refreshWeather, fetchExtras]);

  useEffect(() => {
    if (!location) return;
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location, refresh]);

  return { isLoading, error, refresh, hourlyForecast: hourly, dailyForecast: daily, airQuality, uvIndex };
}
