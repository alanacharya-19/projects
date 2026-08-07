import { API_CONFIG } from '@/constants/api';
import type { Alert, AlertSeverity, DisasterType, Coordinates } from '@/types';
import { DisasterType as DT, AlertSeverity as AS } from '@/types';

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Disaster API error: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ============================================================
// Earthquakes - USGS
// ============================================================

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string;
    time: number;
    updated: number | null;
    url: string | null;
    title: string;
    alert: string | null;
    felt: number | null;
    tsunami: number;
  };
  geometry: { coordinates: [number, number, number] };
}

interface USGSResponse {
  features: USGSFeature[];
}

function usgsSeverity(mag: number | null): AlertSeverity {
  if (mag == null) return AS.MINOR;
  if (mag >= 7) return AS.EXTREME;
  if (mag >= 5.5) return AS.SEVERE;
  if (mag >= 4) return AS.MODERATE;
  return AS.MINOR;
}

export async function fetchEarthquakes(bbox?: {
  minLat: number; minLon: number; maxLat: number; maxLon: number;
}): Promise<Alert[]> {
  const { USGS_EARTHQUAKE } = API_CONFIG;
  let url = `${USGS_EARTHQUAKE.FEATURES_URL}/2.5_week.geojson`;

  if (bbox) {
    url = `${USGS_EARTHQUAKE.BASE_URL}/query?format=geojson&starttime=${getDaysAgo(7)}&minmagnitude=2.5&minlatitude=${bbox.minLat}&maxlatitude=${bbox.maxLat}&minlongitude=${bbox.minLon}&maxlongitude=${bbox.maxLon}&orderby=time`;
  }

  const data = await handleResponse<USGSResponse>(await fetch(url));

  return data.features.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const sev = usgsSeverity(f.properties.mag);

    return {
      id: `eq-${f.id}`,
      title: f.properties.title,
      message: `${f.properties.place}. M${f.properties.mag ?? '?'}. ${f.properties.tsunami ? 'Tsunami warning possible.' : ''}`,
      severity: sev,
      type: DT.EARTHQUAKE as DisasterType,
      coordinates: { latitude: lat, longitude: lon },
      radius: 0,
      startTime: f.properties.time,
      source: 'USGS',
      isActive: true,
      isRead: false,
      isDismissed: false,
      metadata: null,
    } as Alert;
  });
}

// ============================================================
// Floods - GloFAS / NASA
// ============================================================

interface GloFASFeature {
  properties: {
    name: string;
    alert_level: string;
    issued: string;
    country: string;
    link: string;
  };
  geometry: { coordinates: [number, number] };
}

interface GloFASResponse {
  features: GloFASFeature[];
}

function glofasSeverity(level: string): AlertSeverity {
  switch (level?.toLowerCase()) {
    case 'extreme': case 'exceptional': return AS.EXTREME;
    case 'severe': case 'high': return AS.SEVERE;
    case 'moderate': case 'medium': return AS.MODERATE;
    default: return AS.MINOR;
  }
}

export async function fetchFloodData(region?: Coordinates): Promise<Alert[]> {
  let url = 'https://global-flood-apis.glofas.ecmwf.int/api/v4/public/alerts?format=json';
  if (region) url += `&lat=${region.latitude}&lon=${region.longitude}`;

  const data = await handleResponse<GloFASResponse>(await fetch(url));

  return data.features.map((f, idx) => ({
    id: `flood-${idx}-${Date.parse(f.properties.issued)}`,
    title: f.properties.name ?? 'Flood Alert',
    message: `Flood alert: ${f.properties.name}. Level: ${f.properties.alert_level}.`,
    severity: glofasSeverity(f.properties.alert_level),
    type: DT.FLOOD as DisasterType,
    coordinates: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
    radius: 0,
    startTime: f.properties.issued ? new Date(f.properties.issued).getTime() : Date.now(),
    source: 'GloFAS',
    isActive: true,
    isRead: false,
    isDismissed: false,
    metadata: null,
  } as Alert));
}

// ============================================================
// Wildfires - NASA FIRMS
// ============================================================

interface FIRMSRow {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  frp: number;
  acq_date: string;
  satellite: string;
  confidence: string;
}

function fireSeverity(brightTi4: number, frp: number): AlertSeverity {
  if (brightTi4 > 500 || frp > 100) return AS.EXTREME;
  if (brightTi4 > 400 || frp > 50) return AS.SEVERE;
  if (brightTi4 > 330 || frp > 10) return AS.MODERATE;
  return AS.MINOR;
}

function parseFIRMSCsv(text: string): FIRMSRow[] {
  const lines = text.trim().split('\n');
  if (lines.length <= 1) return [];
  const rows: FIRMSRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 12) continue;
    const latitude = parseFloat(cols[0]);
    const longitude = parseFloat(cols[1]);
    const brightTi4 = parseFloat(cols[8]);
    const frp = parseFloat(cols[11]);
    if (isNaN(latitude) || isNaN(longitude)) continue;
    rows.push({ latitude, longitude, bright_ti4: brightTi4, frp, acq_date: cols[5], satellite: cols[13], confidence: cols[15] });
  }
  return rows;
}

export async function fetchWildfires(bbox?: {
  minLat: number; minLon: number; maxLat: number; maxLon: number;
}): Promise<Alert[]> {
  const { NASA_FIRMS } = API_CONFIG;
  const source = 'VIIRS_SNPP_NRT';
  let url: string;

  if (bbox) {
    url = `${NASA_FIRMS.BASE_URL}/csv/${NASA_FIRMS.MAP_KEY}/${source}/${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}/1/2000`;
  } else {
    url = `${NASA_FIRMS.BASE_URL}/csv/${NASA_FIRMS.MAP_KEY}/${source}/global/1/2000`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FIRMS API error: HTTP ${res.status}`);
  const rows = parseFIRMSCsv(await res.text());

  return rows.map((r, idx) => ({
    id: `fire-${idx}-${r.acq_date}`,
    title: `Wildfire Detected (${r.satellite})`,
    message: `Fire hotspot. Brightness: ${r.bright_ti4.toFixed(0)}K. FRP: ${r.frp.toFixed(0)} MW. Confidence: ${r.confidence}.`,
    severity: fireSeverity(r.bright_ti4, r.frp),
    type: DT.WILDFIRE as DisasterType,
    coordinates: { latitude: r.latitude, longitude: r.longitude },
    radius: 0,
    startTime: r.acq_date ? new Date(r.acq_date).getTime() : Date.now(),
    source: 'NASA FIRMS',
    isActive: true,
    isRead: false,
    isDismissed: false,
    metadata: null,
  } as Alert));
}

// ============================================================
// Storms - NWS (US) / OpenWeather (global)
// ============================================================

interface NOAAFeature {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  effective: string;
  expires: string;
  geometry: { coordinates: [number, number] } | null;
}

interface NOAAResponse {
  features: NOAAFeature[];
}

function noaaSeverity(sev: string): AlertSeverity {
  switch (sev?.toLowerCase()) {
    case 'extreme': return AS.EXTREME;
    case 'severe': return AS.SEVERE;
    case 'moderate': return AS.MODERATE;
    default: return AS.MINOR;
  }
}

function mapNwsDisasterType(event: string): DisasterType {
  const e = event.toLowerCase();
  if (e.includes('tornado')) return DT.CYCLONE;
  if (e.includes('hurricane') || e.includes('typhoon') || e.includes('cyclone') || e.includes('tropical')) return DT.CYCLONE;
  if (e.includes('tsunami')) return DT.TSUNAMI;
  if (e.includes('flood')) return DT.FLOOD;
  if (e.includes('fire') || e.includes('red flag')) return DT.WILDFIRE;
  if (e.includes('landslide')) return DT.LANDSLIDE;
  if (e.includes('heat')) return DT.HEATWAVE;
  return DT.CYCLONE;
}

export async function fetchStormData(region?: Coordinates): Promise<Alert[]> {
  const url = region
    ? `https://api.weather.gov/alerts/active?point=${region.latitude},${region.longitude}`
    : 'https://api.weather.gov/alerts/active?status=actual&event=Severe%20Thunderstorm%20Warning,Tornado%20Warning,Hurricane%20Warning,Tropical%20Storm%20Warning';

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AlertApp/1.0', Accept: 'application/geo+json' },
  });

  if (!res.ok) throw new Error(`NWS API error: HTTP ${res.status}`);
  const data = await handleResponse<NOAAResponse>(res);

  return data.features.map((f) => {
    const coords = f.geometry?.coordinates;

    return {
      id: `storm-${f.id}`,
      title: f.headline ?? f.event,
      message: f.description ?? f.headline,
      severity: noaaSeverity(f.severity),
      type: mapNwsDisasterType(f.event),
      coordinates: coords ? { latitude: coords[1], longitude: coords[0] } : { latitude: 0, longitude: 0 },
      radius: 0,
      startTime: f.effective ? new Date(f.effective).getTime() : Date.now(),
      source: 'NWS',
      isActive: true,
      isRead: false,
      isDismissed: false,
      metadata: null,
    } as Alert;
  });
}
