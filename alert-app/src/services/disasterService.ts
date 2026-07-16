import type { DisasterAlert, Coordinates } from '@/types';

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Disaster API error: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string;
    time: number;
    updated: number | null;
    url: string | null;
    title: string;
    type: string;
    alert: string | null;
  };
  geometry: { coordinates: [number, number, number] };
}

interface USGSResponse {
  features: USGSFeature[];
}

function usgsAlertSeverity(mag: number | null): DisasterAlert['severity'] {
  if (mag == null) return 'low';
  if (mag >= 7) return 'extreme';
  if (mag >= 5.5) return 'high';
  if (mag >= 4) return 'moderate';
  return 'low';
}

export async function fetchEarthquakes(bbox?: {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}): Promise<DisasterAlert[]> {
  let url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';

  if (bbox) {
    const { minLon, minLat, maxLon, maxLat } = bbox;
    url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDaysAgo(7)}&minmagnitude=2.5&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&orderby=time`;
  }

  const data = await handleResponse<USGSResponse>(await fetch(url));

  return data.features.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return {
      id: `eq-${f.id}`,
      type: 'earthquake' as const,
      title: f.properties.title,
      description: `${f.properties.place}. Magnitude ${f.properties.mag ?? 'unknown'}.`,
      severity: usgsAlertSeverity(f.properties.mag),
      status: 'unread' as const,
      location: { latitude: lat, longitude: lon },
      source: 'USGS',
      createdAt: new Date(f.properties.time).toISOString(),
      updatedAt: f.properties.updated ? new Date(f.properties.updated).toISOString() : new Date().toISOString(),
      url: f.properties.url ?? undefined,
      metadata: { magnitude: f.properties.mag, place: f.properties.place, alert: f.properties.alert },
    };
  });
}

interface GloFASFeature {
  type: string;
  properties: {
    name: string;
    event_type: string;
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

function glofasSeverity(level: string): DisasterAlert['severity'] {
  switch (level?.toLowerCase()) {
    case 'extreme':
    case 'exceptional':
      return 'extreme';
    case 'severe':
    case 'high':
      return 'high';
    case 'moderate':
    case 'medium':
      return 'moderate';
    default:
      return 'low';
  }
}

export async function fetchFloodData(region?: Coordinates): Promise<DisasterAlert[]> {
  let url = 'https://global-flood-apis.glofas.ecmwf.int/api/v4/public/alerts?format=json';

  if (region) {
    url += `&lat=${region.latitude}&lon=${region.longitude}`;
  }

  const data = await handleResponse<GloFASResponse>(await fetch(url));

  return data.features.map((f, idx) => ({
    id: `flood-${idx}-${Date.parse(f.properties.issued)}`,
    type: 'flood' as const,
    title: f.properties.name ?? 'Flood Alert',
    description: `Flood alert for ${f.properties.name}. Level: ${f.properties.alert_level}.`,
    severity: glofasSeverity(f.properties.alert_level),
    status: 'unread' as const,
    location: {
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    },
    source: 'GloFAS',
    createdAt: f.properties.issued ? new Date(f.properties.issued).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: f.properties.link,
    metadata: { alertLevel: f.properties.alert_level, country: f.properties.country },
  }));
}

interface FIRMSFeature {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  frp: number;
  daynight: string;
  acq_date: string;
  scan: number;
  track: number;
  satellite: string;
  instrument: string;
  confidence: string;
  version: string;
}

function fireSeverity(brightTi4: number, frp: number): DisasterAlert['severity'] {
  if (brightTi4 > 500 || frp > 100) return 'extreme';
  if (brightTi4 > 400 || frp > 50) return 'high';
  if (brightTi4 > 330 || frp > 10) return 'moderate';
  return 'low';
}

export async function fetchWildfires(bbox?: {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}): Promise<DisasterAlert[]> {
  let url = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/OPEN';
  const source = 'VIIRS_SNPP_NRT';

  if (bbox) {
    const { minLon, minLat, maxLon, maxLat } = bbox;
    url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/OPEN/${source}/${minLon},${minLat},${maxLon},${maxLat}/1/2000`;
  } else {
    url = `${url}/${source}/global/1/2000`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FIRMS API error: HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.trim().split('\n');
  if (lines.length <= 1) return [];

  const alerts: DisasterAlert[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 12) continue;

    const latitude = parseFloat(cols[0]);
    const longitude = parseFloat(cols[1]);
    const brightTi4 = parseFloat(cols[8]);
    const frp = parseFloat(cols[11]);
    const acqDate = cols[5];
    const satellite = cols[13];
    const confidence = cols[15];

    if (isNaN(latitude) || isNaN(longitude)) continue;

    alerts.push({
      id: `fire-${i}-${acqDate}`,
      type: 'wildfire',
      title: `Wildfire Detected (${satellite})`,
      description: `Fire hotspot detected. Brightness: ${brightTi4.toFixed(0)}K. FRP: ${frp.toFixed(0)} MW. Confidence: ${confidence}.`,
      severity: fireSeverity(brightTi4, frp),
      status: 'unread',
      location: { latitude, longitude },
      source: 'NASA FIRMS',
      createdAt: acqDate ? new Date(acqDate).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { brightness: brightTi4, frp, satellite, confidence },
    });
  }

  return alerts;
}

interface NOAAFeature {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string;
  expires: string;
  geometry: { coordinates: [number, number] } | null;
}

interface NOAAResponse {
  features: NOAAFeature[];
}

function noaaSeverity(sev: string): DisasterAlert['severity'] {
  switch (sev?.toLowerCase()) {
    case 'extreme':
      return 'extreme';
    case 'severe':
      return 'high';
    case 'moderate':
      return 'moderate';
    default:
      return 'low';
  }
}

export async function fetchStormData(region?: Coordinates): Promise<DisasterAlert[]> {
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
      type: 'storm' as DisasterAlert['type'],
      title: f.headline ?? f.event,
      description: f.description ?? f.headline,
      severity: noaaSeverity(f.severity),
      status: 'unread' as DisasterAlert['status'],
      location: coords
        ? { latitude: coords[1], longitude: coords[0] }
        : { latitude: 0, longitude: 0 },
      source: 'NWS',
      createdAt: f.effective ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: `https://alerts.weather.gov/${f.id}`,
      metadata: {
        event: f.event,
        urgency: f.urgency,
        certainty: f.certainty,
        expires: f.expires,
      },
    };
  });
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
