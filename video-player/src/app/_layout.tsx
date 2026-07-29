import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="home" />
        <Stack.Screen name="library" />
        <Stack.Screen name="search" />
        <Stack.Screen name="details" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="playlist" />
        <Stack.Screen name="downloads" />
        <Stack.Screen name="history" />
        <Stack.Screen name="favorites" />
        <Stack.Screen
          name="player"
          options={{
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </>
  );
}