import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData } from '@/types';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '';

function assertApiKey() {
  if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not set. Add EXPO_PUBLIC_OPENWEATHER_API_KEY to your .env');
}

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().then((data) => {
      const msg = data?.message ?? `HTTP ${res.status}`;
      throw new Error(`Weather API error: ${msg}`);
    });
  }
  return res.json() as Promise<T>;
}

interface OWMCurrentResponse {
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number; deg: number };
  visibility: number;
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  sys: { sunrise: number; sunset: number; country: string };
  name: string;
  dt: number;
  coord: { lat: number; lon: number };
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  assertApiKey();
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const data = await handleResponse<OWMCurrentResponse>(await fetch(url));
  const weather = data.weather[0];

  return {
    temperature: Math.round(data.main.temp * 10) / 10,
    feelsLike: Math.round(data.main.feels_like * 10) / 10,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    condition: weather.main,
    description: weather.description,
    icon: weather.icon,
    visibility: data.visibility,
    uvIndex: 0,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    dt: data.dt,
    city: data.name,
    country: data.sys.country,
  };
}

interface OWMHourlyResponse {
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{ main: string; description: string; icon: string }>;
    pop: number;
  }>;
}

export async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,daily,alerts&appid=${API_KEY}`;
  const data = await handleResponse<OWMHourlyResponse>(await fetch(url));

  return data.hourly.slice(0, 24).map((h) => ({
    time: h.dt,
    temperature: Math.round(h.temp * 10) / 10,
    feelsLike: Math.round(h.feels_like * 10) / 10,
    humidity: h.humidity,
    windSpeed: h.wind_speed,
    windDirection: h.wind_deg,
    condition: h.weather[0]?.main ?? 'Unknown',
    description: h.weather[0]?.description ?? 'Unknown',
    icon: h.weather[0]?.icon ?? '01d',
    precipitationProbability: Math.round(h.pop * 100),
  }));
}

interface OWMDailyResponse {
  daily: Array<{
    dt: number;
    temp: { min: number; max: number };
    humidity: number;
    wind_speed: number;
    weather: Array<{ main: string; description: string; icon: string }>;
    pop: number;
    sunrise: number;
    sunset: number;
  }>;
}

export async function fetchDailyForecast(lat: number, lon: number): Promise<DailyForecast[]> {
  assertApiKey();
  const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${API_KEY}`;
  const data = await handleResponse<OWMDailyResponse>(await fetch(url));

  return data.daily.map((d) => ({
    time: d.dt,
    tempMin: Math.round(d.temp.min * 10) / 10,
    tempMax: Math.round(d.temp.max * 10) / 10,
    humidity: d.humidity,
    windSpeed: d.wind_speed,
    condition: d.weather[0]?.main ?? 'Unknown',
    description: d.weather[0]?.description ?? 'Unknown',
    icon: d.weather[0]?.icon ?? '01d',
    precipitationProbability: Math.round(d.pop * 100),
    sunrise: d.sunrise,
    sunset: d.sunset,
  }));
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
  list: Array<{
    main: { aqi: number };
    components: { co: number; no2: number; o3: number; pm2_5: number; pm10: number; so2: number };
  }>;
}

const AQI_LABELS: Record<number, string> = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  assertApiKey();
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
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
    label: AQI_LABELS[item.main.aqi] ?? 'Unknown',
  };
}
