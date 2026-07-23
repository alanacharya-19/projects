import { API_CONFIG } from '@/constants/api';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData, CurrentWeather, WeatherAlert } from '@/types';

const { ONECALL_URL, AIR_POLLUTION_URL, API_KEY, UNITS } = API_CONFIG.OPENWEATHER;
const OWM_25 = 'https://api.openweathermap.org/data/2.5';

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

// ============================================================
// Current Weather — /data/2.5/weather (free)
// ============================================================

interface OWMWeatherResponse {
  coord: { lon: number; lat: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  clouds: { all: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  sys: { sunrise: number; sunset: number };
  dt: number;
  timezone: number;
  name: string;
}

function mapCurrentWeather(data: OWMWeatherResponse): CurrentWeather {
  const w = data.main;
  const weather = data.weather[0];
  return {
    temperature: Math.round(w.temp * 10) / 10,
    feelsLike: Math.round(w.feels_like * 10) / 10,
    humidity: w.humidity,
    pressure: w.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    windGust: data.wind.gust,
    visibility: data.visibility,
    uvIndex: 0,
    cloudCover: data.clouds.all,
    description: weather?.description ?? 'Unknown',
    icon: weather?.icon ?? '01d',
    main: weather?.main ?? 'Unknown',
    timestamp: data.dt,
    sunrise: data.sys?.sunrise ?? 0,
    sunset: data.sys?.sunset ?? 0,
  };
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  assertApiKey();
  const url = `${OWM_25}/weather?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&appid=${API_KEY}`;
  const data = await handleResponse<OWMWeatherResponse>(await fetch(url));
  const current = mapCurrentWeather(data);

  return {
    current,
    hourly: [],
    daily: [],
    alerts: [],
    location: { latitude: data.coord.lat, longitude: data.coord.lon },
  };
}

// ============================================================
// Hourly Forecast — OneCall 2.5 or fallback to 2.5/forecast
// ============================================================

interface OWMOneCallHourly {
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

interface OWMForecastItem {
  dt: number;
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number; deg: number };
  weather: { main: string; description: string; icon: string }[];
  pop: number;
  rain?: { '3h': number };
}

interface OWMForecastResponse {
  list: OWMForecastItem[];
}

export async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  assertApiKey();

  // Try OneCall first (paid), fall back to 2.5/forecast (free)
  try {
    const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,daily,alerts&appid=${API_KEY}`;
    const data = await handleResponse<OWMOneCallHourly>(await fetch(url));
    if (data.hourly) {
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
  } catch {
    // OneCall not available, use 2.5/forecast
  }

  const url = `${OWM_25}/forecast?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&appid=${API_KEY}`;
  const data = await handleResponse<OWMForecastResponse>(await fetch(url));

  return data.list.slice(0, 8).map((h) => ({
    time: h.dt,
    temperature: Math.round(h.main.temp * 10) / 10,
    feelsLike: Math.round(h.main.feels_like * 10) / 10,
    humidity: h.main.humidity,
    windSpeed: h.wind.speed,
    windDirection: h.wind.deg,
    description: h.weather[0]?.description ?? 'Unknown',
    icon: h.weather[0]?.icon ?? '01d',
    precipitationProbability: Math.round(h.pop * 100),
    precipitationAmount: h.rain?.['3h'] ?? 0,
    uvIndex: 0,
  }));
}

// ============================================================
// Daily Forecast — OneCall 2.5 or fallback to 2.5/forecast
// ============================================================

interface OWMOneCallDaily {
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

  // Try OneCall first
  try {
    const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,hourly,alerts&appid=${API_KEY}`;
    const data = await handleResponse<OWMOneCallDaily>(await fetch(url));
    if (data.daily) {
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
  } catch {
    // OneCall not available, use 2.5/forecast
  }

  const url = `${OWM_25}/forecast?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&appid=${API_KEY}`;
  const data = await handleResponse<OWMForecastResponse>(await fetch(url));

  const dailyMap = new Map<string, OWMForecastItem[]>();
  for (const item of data.list) {
    const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, []);
    dailyMap.get(dateStr)!.push(item);
  }

  const results: DailyForecast[] = [];
  for (const [dateStr, items] of dailyMap) {
    if (results.length >= 5) break;
    const temps = items.map((i) => i.main.temp);
    const date = new Date(dateStr);
    const midItem = items[Math.floor(items.length / 2)];
    results.push({
      date: dateStr,
      dayName: DAY_NAMES[date.getDay()],
      tempHigh: Math.round(Math.max(...temps) * 10) / 10,
      tempLow: Math.round(Math.min(...temps) * 10) / 10,
      humidity: midItem.main.humidity,
      precipitationProbability: Math.round(Math.max(...items.map((i) => i.pop)) * 100),
      precipitationAmount: items.reduce((sum, i) => sum + (i.rain?.['3h'] ?? 0), 0),
      windSpeedMax: Math.max(...items.map((i) => i.wind.speed)),
      windDirection: midItem.wind.deg,
      uvIndex: 0,
      description: midItem.weather[0]?.description ?? 'Unknown',
      icon: midItem.weather[0]?.icon ?? '01d',
      sunrise: 0,
      sunset: 0,
      hourly: [],
    });
  }

  return results;
}

// ============================================================
// UV Index — /data/2.5/uvi (free)
// ============================================================

interface OWMUVResponse {
  value: number;
}

export async function fetchUVIndex(lat: number, lon: number): Promise<number> {
  assertApiKey();

  // Try dedicated UV endpoint first
  try {
    const url = `${OWM_25}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const data = await handleResponse<OWMUVResponse>(await fetch(url));
    return data.value;
  } catch {
    // UV endpoint may not be available, try OneCall
  }

  try {
    const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&exclude=minutely,daily,hourly,alerts&appid=${API_KEY}`;
    const data = await handleResponse<{ current?: { uvi?: number } }>(await fetch(url));
    return data.current?.uvi ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// Air Quality — /data/2.5/air_pollution (free)
// ============================================================

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

// ============================================================
// Weather Alerts — OneCall (free tier may not include)
// ============================================================

interface OWMAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export async function fetchWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  assertApiKey();

  try {
    const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${UNITS.METRIC}&exclude=minutely,hourly,daily&appid=${API_KEY}`;
    const data = await handleResponse<{ alerts?: OWMAlert[] }>(await fetch(url));
    return (data.alerts ?? []).map((a) => ({
      id: `${a.event}-${a.start}`,
      senderName: a.sender_name,
      event: a.event,
      start: a.start,
      end: a.end,
      description: a.description,
      tags: a.tags,
    }));
  } catch {
    return [];
  }
}
