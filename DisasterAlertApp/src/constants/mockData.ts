import { AlertSeverity, DisasterType } from '@/types';

export interface FeedItem {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  severity: AlertSeverity;
  location: string;
  country: string;
  timestamp: number;
  coordinates: { latitude: number; longitude: number };
}

export const MOCK_FEED: FeedItem[] = [
  { id: "f1", type: DisasterType.EARTHQUAKE, title: "6.2 Magnitude Earthquake", description: "Moderate earthquake felt across multiple districts. No major damage reported yet.", severity: AlertSeverity.SEVERE, location: "Tokyo, Japan", country: "Japan", timestamp: Date.now() - 3600000, coordinates: { latitude: 35.6762, longitude: 139.6503 } },
  { id: "f2", type: DisasterType.FLOOD, title: "Flash Flood Warning", description: "Heavy rainfall causing flash flooding in low-lying areas. Evacuations underway.", severity: AlertSeverity.EXTREME, location: "Mumbai, India", country: "India", timestamp: Date.now() - 7200000, coordinates: { latitude: 19.076, longitude: 72.8777 } },
  { id: "f3", type: DisasterType.WILDFIRE, title: "Wildfire Spreading", description: "Fast-moving wildfire threatening residential areas. Multiple structures at risk.", severity: AlertSeverity.EXTREME, location: "Los Angeles, USA", country: "USA", timestamp: Date.now() - 10800000, coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { id: "f4", type: DisasterType.CYCLONE, title: "Cyclone Approaching", description: "Category 3 cyclone expected to make landfall within 24 hours.", severity: AlertSeverity.SEVERE, location: "Brisbane, Australia", country: "Australia", timestamp: Date.now() - 14400000, coordinates: { latitude: -27.4698, longitude: 153.0251 } },
  { id: "f5", type: DisasterType.HEATWAVE, title: "Extreme Heatwave", description: "Temperatures exceeding 45°C expected for the next 5 days.", severity: AlertSeverity.MODERATE, location: "New Delhi, India", country: "India", timestamp: Date.now() - 18000000, coordinates: { latitude: 28.6139, longitude: 77.209 } },
  { id: "f6", type: DisasterType.EARTHQUAKE, title: "4.8 Magnitude Earthquake", description: "Light earthquake recorded. Minor structural damage in older buildings.", severity: AlertSeverity.MODERATE, location: "Istanbul, Turkey", country: "Turkey", timestamp: Date.now() - 21600000, coordinates: { latitude: 41.0082, longitude: 28.9784 } },
  { id: "f7", type: DisasterType.TSUNAMI, title: "Tsunami Advisory", description: "Small tsunami waves possible after offshore earthquake. Coastal areas on alert.", severity: AlertSeverity.SEVERE, location: "Santiago, Chile", country: "Chile", timestamp: Date.now() - 25200000, coordinates: { latitude: -33.4489, longitude: -70.6693 } },
  { id: "f8", type: DisasterType.LANDSLIDE, title: "Landslide After Heavy Rain", description: "Major landslide blocking major highway. Several homes evacuated.", severity: AlertSeverity.SEVERE, location: "Nepal", country: "Nepal", timestamp: Date.now() - 28800000, coordinates: { latitude: 27.7172, longitude: 85.324 } },
];
