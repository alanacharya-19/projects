export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  description: string;
  icon: string;
  visibility: number;
  uvIndex: number;
  sunrise: number;
  sunset: number;
  dt: number;
  city: string;
  country: string;
}

export interface HourlyForecast {
  time: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  description: string;
  icon: string;
  precipitationProbability: number;
}

export interface DailyForecast {
  time: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  precipitationProbability: number;
  sunrise: number;
  sunset: number;
}

export interface AirQualityData {
  aqi: number;
  co: number;
  no2: number;
  o3: number;
  pm2_5: number;
  pm10: number;
  so2: number;
  label: string;
}

export type DisasterType = 'earthquake' | 'flood' | 'wildfire' | 'storm';

export type AlertSeverity = 'low' | 'moderate' | 'high' | 'extreme';

export type AlertStatus = 'active' | 'dismissed' | 'read' | 'unread';

export interface DisasterAlert {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  location: Coordinates;
  distance?: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  border: string;
  divider: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  blue: string;
  blueLight: string;
  green: string;
  greenLight: string;
  orange: string;
  orangeLight: string;
  red: string;
  redLight: string;
  overlay: string;
  shadow: string;
  white: string;
}

export interface AppSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  distanceUnit: 'km' | 'miles';
  alertDistance: number;
  severityFilter: AlertSeverity[];
  notificationPrefs: NotificationPrefs;
  theme: ThemeMode;
}

export interface NotificationPrefs {
  weatherAlerts: boolean;
  earthquakes: boolean;
  floods: boolean;
  wildfires: boolean;
  storms: boolean;
  emergencyBroadcasts: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface UserLocation extends Coordinates {
  city?: string;
  region?: string;
  country?: string;
  timestamp?: number;
}
