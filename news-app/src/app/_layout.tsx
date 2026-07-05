import { StatusBar, View } from "react-native";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#c62828" }}>
      <StatusBar barStyle="light-content" backgroundColor="#c62828" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
