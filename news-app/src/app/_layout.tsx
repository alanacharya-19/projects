import { StatusBar } from "react-native";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#c62828" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 350,
          animationTypeForReplace: "push",
        }}
      />
    </>
  );
}
