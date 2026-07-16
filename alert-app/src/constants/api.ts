export const API_CONFIG = {
  // OpenWeatherMap API
  OPENWEATHER: {
    BASE_URL: 'https://api.openweathermap.org/data/3.0',
    GEO_URL: 'https://api.openweathermap.org/geo/1.0',
    ONECALL_URL: 'https://api.openweathermap.org/data/3.0/onecall',
    AIR_POLLUTION_URL: 'https://api.openweathermap.org/data/2.5/air_pollution',
    API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '',
    UNITS: {
      METRIC: 'metric',
      IMPERIAL: 'imperial',
    },
  },

  // USGS Earthquake API
  USGS_EARTHQUAKE: {
    BASE_URL: 'https://earthquake.usgs.gov/fdsnws/event/1',
    FEATURES_URL: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary',
    SIGNIFICANT: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant.geojson',
    ALL_HOUR: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    ALL_DAY: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    ALL_WEEK: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
    ALL_MONTH: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
  },

  // NASA FIRMS (Fire Information for Resource Management System) - Wildfire data
  NASA_FIRMS: {
    BASE_URL: 'https://firms.modaps.eosdis.nasa.gov/api/area',
    MAP_KEY: process.env.EXPO_PUBLIC_NASA_FIRMS_KEY ?? '',
    CSV_URL: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire',
    WORLDWIDE_24H: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/c6/worldwide/c6_worldwide_24h.csv',
  },

  // NASA Flood Monitoring
  NASA_FLOOD: {
    BASE_URL: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    NRT_URL: 'https://nasagrace.unl.edu/GRACE/',
  },

  // OpenAQ - Air Quality data
  OPEN_AQ: {
    BASE_URL: 'https://api.openaq.org/v3',
    MEASUREMENTS_URL: 'https://api.openaq.org/v3/measurements',
    LOCATIONS_URL: 'https://api.openaq.org/v3/locations',
    API_KEY: process.env.EXPO_PUBLIC_OPENAQ_API_KEY ?? '',
  },

  // RainViewer - Weather radar
  RAINVIEWER: {
    BASE_URL: 'https://api.rainviewer.com',
    PUBLIC_API: 'https://api.rainviewer.com/public/weather-maps.json',
    TILE_URL: 'https://tilecache.rainviewer.com/v2/radar',
  },

  // Mapbox - Maps
  MAPBOX: {
    BASE_URL: 'https://api.mapbox.com',
    ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
    STYLE_URL: 'mapbox://styles/mapbox',
    STYLES: {
      STANDARD: 'mapbox://styles/mapbox/streets-v12',
      SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
      TERRAIN: 'mapbox://styles/mapbox/outdoors-v12',
      DARK: 'mapbox://styles/mapbox/dark-v11',
    },
  },

  // Backend API
  BACKEND: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
    TIMEOUT: 15000,
    ENDPOINTS: {
      AUTH: '/auth',
      ALERTS: '/alerts',
      USERS: '/users',
      LOCATIONS: '/locations',
      WEATHER: '/weather',
      DISASTERS: '/disasters',
      AI_CHAT: '/ai/chat',
      AI_ASSESSMENT: '/ai/assessment',
      NOTIFICATIONS: '/notifications',
      SURVIVAL_GUIDES: '/survival-guides',
      EMERGENCY_CONTACTS: '/emergency-contacts',
      STATS: '/statistics',
    },
  },
} as const;

export const CACHE_DURATIONS = {
  WEATHER_CURRENT: 10 * 60 * 1000,       // 10 minutes
  WEATHER_HOURLY: 30 * 60 * 1000,         // 30 minutes
  WEATHER_DAILY: 60 * 60 * 1000,          // 1 hour
  EARTHQUAKE_FEED: 5 * 60 * 1000,         // 5 minutes
  WILDFIRE_DATA: 15 * 60 * 1000,          // 15 minutes
  AIR_QUALITY: 30 * 60 * 1000,            // 30 minutes
  RADAR_DATA: 2 * 60 * 1000,              // 2 minutes
  SURVIVAL_GUIDES: 24 * 60 * 60 * 1000,   // 24 hours
  USER_SETTINGS: 60 * 60 * 1000,          // 1 hour
} as const;

export const REQUEST_LIMITS = {
  OPENWEATHER_CALLS_PER_MINUTE: 60,
  USGS_CALLS_PER_MINUTE: 100,
  NASA_FIRMS_DAILY: 5000,
  OPENAQ_CALLS_PER_MINUTE: 60,
} as const;
