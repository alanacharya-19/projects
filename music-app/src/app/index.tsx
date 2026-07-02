import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { usePermissions } from '../hooks/usePermissions';
import { useLibraryStore } from '../store/libraryStore';

export default function SplashScreen() {
  const router = useRouter();
  const { hasPermission, loading: permLoading } = usePermissions();

  useEffect(() => {
    if (!permLoading) {
      if (hasPermission) {
        useLibraryStore.getState().scanLibrary();
      }
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [permLoading, hasPermission]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.dark.background }]}>
      <Image source={require('../../assets/images/splash-icon.png')} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.background, justifyContent: 'center', alignItems: 'center' },
  image: { width: 200, height: 200 },
});
