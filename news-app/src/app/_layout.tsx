import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import { BookmarkProvider } from "../context/BookmarkContext";
import { NotificationProvider } from "../context/NotificationContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function RootLayoutInner() {
  const { colors } = useTheme();
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
        <NotificationProvider>
          <RootLayoutInner />
        </NotificationProvider>
      </BookmarkProvider>
    </ThemeProvider>
  );
}
