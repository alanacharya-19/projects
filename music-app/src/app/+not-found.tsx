import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import TrackPlayer from 'react-native-track-player';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    TrackPlayer.getActiveTrack().then((track) => {
      if (track) {
        router.replace('/now-playing');
      } else {
        router.replace('/(tabs)');
      }
    }).catch(() => router.replace('/(tabs)'));
  }, []);

  return null;
}
