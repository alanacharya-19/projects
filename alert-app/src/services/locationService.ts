import * as Location from 'expo-location';
import type { UserLocation, Coordinates } from '@/types';

const EARTH_RADIUS_M = 6_371_000;

export async function getCurrentLocation(): Promise<UserLocation> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
    if (newStatus !== 'granted') {
      throw new Error('Location permission denied. Please enable location access in Settings.');
    }
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10_000,
  });

  const coords: UserLocation = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
  };

  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    if (place) {
      coords.city = place.city ?? place.subregion ?? undefined;
      coords.region = place.region ?? undefined;
      coords.country = place.country ?? undefined;
    }
  } catch {
    // Geocoding is best-effort
  }

  return coords;
}

export function watchPosition(
  callback: (location: UserLocation) => void,
  onError?: (error: Error) => void
): { remove: () => void } {
  const subscription = Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 500,
      timeInterval: 60_000,
    },
    async (location) => {
      const coords: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };

      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (place) {
          coords.city = place.city ?? place.subregion ?? undefined;
          coords.region = place.region ?? undefined;
          coords.country = place.country ?? undefined;
        }
      } catch {
        // best-effort
      }

      callback(coords);
    }
  );

  return {
    remove: () => {
      subscription.then((sub) => sub.remove());
    },
  };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export async function getAddressFromCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!place) return null;
    return [place.name, place.street, place.city, place.region, place.country].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}
