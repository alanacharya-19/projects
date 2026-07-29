import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { AlertProvider } from '@/context/AlertContext';
import ErrorBoundary from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { resolvedMode, colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="forecast" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="alerts" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="map" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="emergency" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="survival-guide" />
        <Stack.Screen name="nearby-services" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="statistics" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="global-feed" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai-chat" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="earthquake-monitor" />
        <Stack.Screen name="flood-monitor" />
        <Stack.Screen name="wildfire-monitor" />
        <Stack.Screen name="alert/[id]" />
        <Stack.Screen
          name="+not-found"
          options={{
            headerShown: true,
            headerTitle: 'Not Found',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.surface },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AlertProvider>
            <RootLayoutNav />
          </AlertProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
