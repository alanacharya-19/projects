import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { AlertProvider } from '@/context/AlertContext';

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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency" />
        <Stack.Screen name="survival-guide" />
        <Stack.Screen name="nearby-services" />
        <Stack.Screen name="statistics" />
        <Stack.Screen name="global-feed" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="ai-chat" />
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
    <ThemeProvider>
      <AppProvider>
        <AlertProvider>
          <RootLayoutNav />
        </AlertProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
