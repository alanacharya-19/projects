import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import { BookmarkProvider } from "../context/BookmarkContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function RootLayoutInner() {
  const { colors, theme } = useTheme();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 300,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <BookmarkProvider>
        <RootLayoutInner />
      </BookmarkProvider>
    </ThemeProvider>
  );
}
