import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import { BookmarkProvider } from "../context/BookmarkContext";

export default function RootLayout() {
  return (
    <BookmarkProvider>
      <StatusBar barStyle="light-content" backgroundColor="#c62828" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 300,
          contentStyle: { backgroundColor: "#f5f6f8" },
        }}
      />
    </BookmarkProvider>
  );
}
