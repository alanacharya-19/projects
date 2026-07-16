import { API_CONFIG } from '@/constants/api';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData, CurrentWeather, WeatherAlert } from '@/types';

const { ONECALL_URL, AIR_POLLUTION_URL, API_KEY, UNITS } = API_CONFIG.OPENWEATHER;

function assertApiKey() {
  if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not set. Add EXPO_PUBLIC_OPENWEATHER_API_KEY to your .env');
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = (data as Record<string, unknown>)?.message ?? `HTTP ${res.status}`;
    throw new Error(`Weather API error: ${msg}`);
  }
  return res.json() as Promise<T>;
}

interface OWMCurrentResponse {
  current: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    visibility: number;
    clouds: number;
    weather: { id: number; main: string; description: string; icon: string }[];
  };
  daily: {
    sunrise: number;
    sunset: number;
  }[];
  timezone_offset: number;
  lat: number;
  lon: number;
}

function mapCurrentWeather(data: OWMCurrentResponse): CurrentWeather {
  const w = data.current;
  const weather = w.weather[0];
  const today = data.daily[0];
  return {
    temperature: Math.round(w.temp * 10) / 10,
    feelsLike: Math.round(w.feels_like * 10) / 10,
    humidity: w.humidity,
    pressure: w.pressure,
    windSpeed: w.wind_speed,
    windDirection: w.wind_deg,
    windGust: w.wind_gust,
    visibility: w.visibility,
    uvIndex: 0,
    cloudCover: w.clouds,
    description: weather?.description ?? 'Unknown',
    icon: weather?.icon ?? '01d',
    main: weather?.main ?? 'Unknown',
    timestamp: w.dt,
    sunrise: today?.sunrise ?? 0,
    sunset: today?.sunset ?? 0,
  };
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`;
  const data = await handleResponse<OWMCurrentResponse>(await fetch(url));

  const current = mapCurrentWeather(data);

  return {
    current,
    hourly: [],
    daily: [],
    alerts: [],
    location: { latitude: data.lat, longitude: data.lon },
  };
}

interface OWMHourlyResponse {
  hourly: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: { main: string; description: string; icon: string }[];
    pop: number;
    rain?: { '1h': number };
  }[];
}

export async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,daily,alerts&appid=${API_KEY}`;
  const data = await handleResponse<OWMHourlyResponse>(await fetch(url));

  return data.hourly.slice(0, 24).map((h) => ({
    time: h.dt,
    temperature: Math.round(h.temp * 10) / 10,
    feelsLike: Math.round(h.feels_like * 10) / 10,
    humidity: h.humidity,
    windSpeed: h.wind_speed,
    windDirection: h.wind_deg,
    description: h.weather[0]?.description ?? 'Unknown',
    icon: h.weather[0]?.icon ?? '01d',
    precipitationProbability: Math.round(h.pop * 100),
    precipitationAmount: h.rain?.['1h'] ?? 0,
    uvIndex: 0,
  }));
}

interface OWMDailyResponse {
  daily: {
    dt: number;
    temp: { min: number; max: number };
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: { main: string; description: string; icon: string }[];
    pop: number;
    rain?: number;
    sunrise: number;
    sunset: number;
  }[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function fetchDailyForecast(lat: number, lon: number): Promise<DailyForecast[]> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,hourly,alerts&appid=${API_KEY}`;
  const data = await handleResponse<OWMDailyResponse>(await fetch(url));

  return data.daily.map((d) => {
    const date = new Date(d.dt * 1000);
    return {
      date: date.toISOString().split('T')[0],
      dayName: DAY_NAMES[date.getDay()],
      tempHigh: Math.round(d.temp.max * 10) / 10,
      tempLow: Math.round(d.temp.min * 10) / 10,
      humidity: d.humidity,
      precipitationProbability: Math.round(d.pop * 100),
      precipitationAmount: d.rain ?? 0,
      windSpeedMax: d.wind_speed,
      windDirection: d.wind_deg,
      uvIndex: 0,
      description: d.weather[0]?.description ?? 'Unknown',
      icon: d.weather[0]?.icon ?? '01d',
      sunrise: d.sunrise,
      sunset: d.sunset,
      hourly: [],
    };
  });
}

interface OWMUVCResponse {
  value: number;
}

export async function fetchUVIndex(lat: number, lon: number): Promise<number> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&exclude=minutely,daily,hourly,alerts&appid=${API_KEY}`;
  const data = await handleResponse<{ current: OWMUVCResponse }>(await fetch(url));
  return data.current.value;
}

interface OWMAirPollutionResponse {
  list: {
    main: { aqi: number };
    components: { co: number; no2: number; o3: number; pm2_5: number; pm10: number; so2: number };
  }[];
}

const AQI_DESCRIPTIONS: Record<number, string> = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  assertApiKey();
  const url = `${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const data = await handleResponse<OWMAirPollutionResponse>(await fetch(url));
  const item = data.list[0];

  return {
    aqi: item.main.aqi,
    co: item.components.co,
    no2: item.components.no2,
    o3: item.components.o3,
    pm2_5: item.components.pm2_5,
    pm10: item.components.pm10,
    so2: item.components.so2,
    description: AQI_DESCRIPTIONS[item.main.aqi] ?? 'Unknown',
  };
}

export async function fetchWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,hourly,daily&appid=${API_KEY}`;
  const data = await handleResponse<{ alerts?: {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
  }[] }>(await fetch(url));

  return (data.alerts ?? []).map((a) => ({
    id: `${a.event}-${a.start}`,
    senderName: a.sender_name,
    event: a.event,
    start: a.start,
    end: a.end,
    description: a.description,
    tags: a.tags,
  }));
}
