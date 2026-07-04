import { View, StyleSheet } from "react-native";

interface Props {
  style?: any;
  pointerEvents?: "none" | "auto" | "box-none";
  reverse?: boolean;
}

const STEP_COLORS = [
  "rgba(0,0,0,0.70)",
  "rgba(0,0,0,0.58)",
  "rgba(0,0,0,0.46)",
  "rgba(0,0,0,0.35)",
  "rgba(0,0,0,0.25)",
  "rgba(0,0,0,0.17)",
  "rgba(0,0,0,0.10)",
  "rgba(0,0,0,0.05)",
  "rgba(0,0,0,0.02)",
  "rgba(0,0,0,0.00)",
];

export default function GradientOverlay({
  style,
  pointerEvents,
  reverse,
}: Props) {
  const colors = reverse ? [...STEP_COLORS].reverse() : STEP_COLORS;
  return (
    <View style={[styles.container, style]} pointerEvents={pointerEvents}>
      {colors.map((color, i) => (
        <View key={i} style={[styles.layer, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  layer: {
    flex: 1,
  },
});
