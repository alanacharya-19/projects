// ============================================================
// Weather Types
// ============================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
  description: string;
  icon: string;
  main: string;
  timestamp: number;
  sunrise: number;
  sunset: number;
}

export interface HourlyForecast {
  time: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number;
  precipitationAmount: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  uvIndex: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  precipitationProbability: number;
  precipitationAmount: number;
  windSpeedMax: number;
  windDirection: number;
  uvIndex: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  hourly: HourlyForecast[];
}

export interface WeatherAlert {
  id: string;
  senderName: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  location: Coordinates;
  airQuality?: AirQualityData;
}

export interface AirQualityData {
  aqi: number;
  co: number;
  no2: number;
  o3: number;
  pm2_5: number;
  pm10: number;
  so2: number;
  description: string;
}

// ============================================================
// Disaster Types
// ============================================================

export enum DisasterType {
  EARTHQUAKE = 'earthquake',
  FLOOD = 'flood',
  WILDFIRE = 'wildfire',
  CYCLONE = 'cyclone',
  TSUNAMI = 'tsunami',
  LANDSLIDE = 'landslide',
  HEATWAVE = 'heatwave',
  COLD_WAVE = 'cold_wave',
  DROUGHT = 'drought',
  VOLCANIC = 'volcanic',
}

export enum AlertSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  EXTREME = 'extreme',
  EMERGENCY = 'emergency',
}

export interface Disaster {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  severity: AlertSeverity;
  coordinates: Coordinates;
  radius: number;
  startTime: number;
  endTime?: number;
  source: string;
  isActive: boolean;
  metadata: EarthquakeData | FloodData | WildfireData | StormData;
}

export interface EarthquakeData {
  magnitude: number;
  depth: number;
  feltIntensity: number;
  tsunamiWarning: boolean;
  aftershocks: number;
  locationName: string;
  usgsId: string;
  mechanism: string;
}

export interface FloodData {
  severity: number;
  riverStage?: number;
  rainfallAmount: number;
  affectedArea: number;
  evacuationRequired: boolean;
  waterLevel?: number;
  source: string;
}

export interface WildfireData {
  acresBurned: number;
  containmentPercent: number;
  fireBehavior: string;
  evacuations: boolean;
  structuresThreatened: number;
  structuresDestroyed: number;
  cause: string;
  startedDate: number;
}

export interface StormData {
  windSpeed: number;
  windGust: number;
  category?: string;
  pressure: number;
  movementSpeed: number;
  movementDirection: number;
  stormName: string;
  basin: string;
  tropicalCycloneClass: string;
}

// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  phoneNumber?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  weatherAlerts: boolean;
  disasterAlerts: boolean;
  locationTracking: boolean;
  darkMode: boolean;
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms';
  distanceUnit: 'km' | 'miles';
  language: string;
  alertRadius: number;
  severityFilter: AlertSeverity[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  isDefault: boolean;
  createdAt: number;
}

// ============================================================
// Alert Types
// ============================================================

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: DisasterType | 'weather' | 'air_quality' | 'custom';
  coordinates: Coordinates;
  radius: number;
  startTime: number;
  endTime?: number;
  source: string;
  isRead: boolean;
  isDismissed: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  label: string;
  action: string;
  url?: string;
}

export interface AlertFilter {
  severity?: AlertSeverity[];
  types?: (DisasterType | 'weather' | 'air_quality')[];
  timeRange?: {
    start: number;
    end: number;
  };
  coordinates?: Coordinates;
  radius?: number;
  isActive?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  foregroundAlerts: boolean;
  backgroundAlerts: boolean;
  severityThreshold: AlertSeverity;
  types: (DisasterType | 'weather' | 'air_quality')[];
}

// ============================================================
// Map Types
// ============================================================

export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  title: string;
  description: string;
  type: 'disaster' | 'shelter' | 'hospital' | 'emergency_service' | 'weather_station';
  severity?: AlertSeverity;
  icon: string;
  color: string;
  data?: Disaster | Shelter | Hospital | EmergencyService;
}

export interface Shelter {
  id: string;
  name: string;
  coordinates: Coordinates;
  address: string;
  capacity: number;
  currentOccupancy: number;
  isPetFriendly: boolean;
  isOpen: boolean;
  contactPhone?: string;
  services: string[];
}

export interface Hospital {
  id: string;
  name: string;
  coordinates: Coordinates;
  address: string;
  phone: string;
  emergencyDepartment: boolean;
  traumaLevel?: number;
  distance?: number;
  isOpen24h: boolean;
  specialties: string[];
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'police' | 'fire' | 'ambulance' | 'coast_guard' | 'rescue';
  coordinates: Coordinates;
  phone: string;
  distance?: number;
}

// ============================================================
// Statistics Types
// ============================================================

export interface WeatherStats {
  averageTemp: number;
  maxTemp: number;
  minTemp: number;
  totalPrecipitation: number;
  rainyDays: number;
  sunnyDays: number;
  avgWindSpeed: number;
  avgHumidity: number;
  dominantWindDirection: number;
}

export interface DisasterStats {
  totalEvents: number;
  byType: Record<DisasterType, number>;
  bySeverity: Record<AlertSeverity, number>;
  averageMagnitude?: number;
  mostAffectedArea: string;
  recentEvents: Disaster[];
}

export interface MonthlyData {
  month: string;
  year: number;
  temperature: number;
  precipitation: number;
  disasters: number;
  alerts: number;
}

// ============================================================
// AI Types
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    weatherData?: WeatherData;
    disasterData?: Disaster[];
    riskLevel?: AlertSeverity;
  };
}

export interface AIRiskAssessment {
  overallRisk: AlertSeverity;
  weatherRisk: AlertSeverity;
  disasterRisk: AlertSeverity;
  airQualityRisk: AlertSeverity;
  factors: RiskFactor[];
  recommendations: string[];
  summary: string;
  confidenceScore: number;
}

export interface RiskFactor {
  type: string;
  severity: AlertSeverity;
  description: string;
  probability: number;
}

export interface AIWeatherSummary {
  summary: string;
  highlights: string[];
  warnings: string[];
  advice: string;
  riskLevel: AlertSeverity;
  generatedAt: number;
}

// ============================================================
// Survival Types
// ============================================================

export interface SurvivalGuide {
  id: string;
  disasterType: DisasterType;
  title: string;
  description: string;
  icon: string;
  beforeSteps: SurvivalStep[];
  duringSteps: SurvivalStep[];
  afterSteps: SurvivalStep[];
  emergencyKit: EmergencyKitItem[];
  dos: string[];
  donts: string[];
  firstAid?: FirstAidGuide;
}

export interface SurvivalStep {
  order: number;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon?: string;
}

export interface FirstAidGuide {
  title: string;
  steps: FirstAidStep[];
  warnings: string[];
}

export interface FirstAidStep {
  order: number;
  action: string;
  description: string;
  warning?: string;
}

export interface EmergencyKitItem {
  item: string;
  quantity: string;
  essential: boolean;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================
// Utility Types
// ============================================================

export type UnitSystem = 'metric' | 'imperial';

export type TimeRange = 'hourly' | 'daily' | 'weekly' | 'monthly';

export type MapStyle = 'standard' | 'satellite' | 'terrain' | 'hybrid';
