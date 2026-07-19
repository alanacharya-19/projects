import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import StatBar from "@/components/StatBar";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows } from "@/constants/theme";

type TimePeriod = "week" | "month" | "year";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const MOCK_DATA = {
  week: {
    weather: { avgTemp: 32, totalRainfall: 12, avgHumidity: 68, avgWindSpeed: 14 },
    disasters: { earthquakes: 2, floods: 1, wildfires: 0 },
    monthlyBars: [
      { label: "Mon", temp: 31, rain: 3 }, { label: "Tue", temp: 33, rain: 5 },
      { label: "Wed", temp: 30, rain: 1 }, { label: "Thu", temp: 35, rain: 0 },
      { label: "Fri", temp: 29, rain: 8 }, { label: "Sat", temp: 34, rain: 2 },
      { label: "Sun", temp: 32, rain: 4 },
    ],
    severity: { minor: 3, moderate: 2, severe: 1, extreme: 0, emergency: 0 },
  },
  month: {
    weather: { avgTemp: 30, totalRainfall: 85, avgHumidity: 72, avgWindSpeed: 12 },
    disasters: { earthquakes: 8, floods: 4, wildfires: 1 },
    monthlyBars: [
      { label: "W1", temp: 29, rain: 22 }, { label: "W2", temp: 31, rain: 18 },
      { label: "W3", temp: 33, rain: 25 }, { label: "W4", temp: 28, rain: 20 },
    ],
    severity: { minor: 12, moderate: 8, severe: 4, extreme: 1, emergency: 0 },
  },
  year: {
    weather: { avgTemp: 27, totalRainfall: 1240, avgHumidity: 65, avgWindSpeed: 15 },
    disasters: { earthquakes: 42, floods: 18, wildfires: 6 },
    monthlyBars: [
      { label: "Jan", temp: 18, rain: 20 }, { label: "Feb", temp: 21, rain: 25 },
      { label: "Mar", temp: 26, rain: 30 }, { label: "Apr", temp: 32, rain: 15 },
      { label: "May", temp: 36, rain: 35 }, { label: "Jun", temp: 34, rain: 120 },
      { label: "Jul", temp: 31, rain: 280 }, { label: "Aug", temp: 30, rain: 260 },
      { label: "Sep", temp: 31, rain: 180 }, { label: "Oct", temp: 29, rain: 60 },
      { label: "Nov", temp: 24, rain: 25 }, { label: "Dec", temp: 20, rain: 10 },
    ],
    severity: { minor: 58, moderate: 42, severe: 22, extreme: 8, emergency: 2 },
  },
};

export default function StatisticsScreen() {
  const { colors, resolvedMode } = useTheme();
  const [period, setPeriod] = useState<TimePeriod>("month");
  const data = useMemo(() => MOCK_DATA[period], [period]);

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === "dark" ? Gradients.forecastDark : Gradients.forecast;
  }, [resolvedMode]);

  const glassColors = useMemo(() => {
    return resolvedMode === "dark"
      ? ["rgba(31,41,55,0.85)", "rgba(17,24,39,0.55)"] as const
      : ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.5)"] as readonly [string, string];
  }, [resolvedMode]);

  const severityItems = [
    { label: "Minor", value: data.severity.minor, color: "#3B82F6", max: 60 },
    { label: "Moderate", value: data.severity.moderate, color: "#F59E0B", max: 45 },
    { label: "Severe", value: data.severity.severe, color: "#F97316", max: 25 },
    { label: "Extreme", value: data.severity.extreme, color: "#DC2626", max: 10 },
    { label: "Emergency", value: data.severity.emergency, color: "#7C2D12", max: 5 },
  ];

  const maxRain = Math.max(...data.monthlyBars.map((b) => b.rain), 1);

  return (
    <GradientBackground colors={gradientColors}>
      <StatusBar barStyle={resolvedMode === "dark" ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Statistics</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Weather & disaster analytics</Text>
        </View>

        {/* Time Period Selector */}
        <LinearGradient
          colors={glassColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.periodSelector, Shadows.sm]}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodTab, period === p.key && { backgroundColor: colors.primary }]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodTabText, { color: period === p.key ? "#FFFFFF" : colors.textMuted }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </LinearGradient>

        {/* Weather Trends */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weather Trends</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Avg Temperature", value: `${data.weather.avgTemp}°C`, maxValue: 50, color: colors.error, icon: "thermometer" },
            { label: "Total Rainfall", value: `${data.weather.totalRainfall}mm`, maxValue: period === "year" ? 1500 : period === "month" ? 100 : 20, color: colors.info, icon: "rainy" },
            { label: "Avg Humidity", value: `${data.weather.avgHumidity}%`, maxValue: 100, color: colors.primary, icon: "water" },
            { label: "Avg Wind Speed", value: `${data.weather.avgWindSpeed} km/h`, maxValue: 80, color: colors.secondary, icon: "speedometer" },
          ].map((stat) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              value={stat.value}
              maxValue={stat.maxValue}
              color={stat.color}
              colors={{ card: colors.surface, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, barTrack: colors.surfaceVariant, accent: colors.primary }}
            />
          ))}
        </View>

        {/* Disaster Events */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Disaster Events</Text>
        <View style={styles.disasterCards}>
          {[
            { icon: "earth" as const, count: data.disasters.earthquakes, label: "Earthquakes", color: "#92400E" },
            { icon: "water" as const, count: data.disasters.floods, label: "Floods", color: "#1D4ED8" },
            { icon: "flame" as const, count: data.disasters.wildfires, label: "Wildfires", color: "#DC2626" },
          ].map((d) => (
            <LinearGradient
              key={d.label}
              colors={glassColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.disasterCard, Shadows.md]}
            >
              <Ionicons name={d.icon} size={28} color={d.color} />
              <Text style={[styles.disasterCount, { color: colors.text }]}>{d.count}</Text>
              <Text style={[styles.disasterLabel, { color: colors.textMuted }]}>{d.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Chart */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {period === "week" ? "Daily Overview" : period === "month" ? "Weekly Overview" : "Monthly Overview"}
        </Text>
        <LinearGradient
          colors={glassColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chartCard, Shadows.md]}
        >
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Temperature</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Rainfall</Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {data.monthlyBars.map((bar, idx) => {
              const barHeight = Math.max((bar.rain / maxRain) * 120, 4);
              const tempHeight = Math.max((bar.temp / 45) * 120, 4);
              return (
                <View key={idx} style={styles.barGroup}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: tempHeight, backgroundColor: colors.error, opacity: 0.8 }]} />
                    <View style={[styles.bar, { height: barHeight, backgroundColor: colors.info, opacity: 0.8 }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Severity Distribution */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Severity Distribution</Text>
        <View style={styles.severityList}>
          {severityItems.map((item) => (
            <StatBar
              key={item.label}
              label={item.label}
              value={String(item.value)}
              maxValue={item.max}
              color={item.color}
              colors={{ card: colors.surface, text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, barTrack: colors.surfaceVariant, accent: colors.primary }}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  header: { marginTop: 48, marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "700", marginBottom: 6, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, fontWeight: "500" },
  periodSelector: { flexDirection: "row", borderRadius: 20, padding: 4, marginBottom: 28 },
  periodTab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  periodTabText: { fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14, letterSpacing: -0.3 },
  statsGrid: { gap: 12, marginBottom: 28 },
  disasterCards: { flexDirection: "row", gap: 12, marginBottom: 28 },
  disasterCard: { flex: 1, borderRadius: 24, padding: 18, alignItems: "center", gap: 6 },
  disasterCount: { fontSize: 24, fontWeight: "800" },
  disasterLabel: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  chartCard: { borderRadius: 24, padding: 20 },
  chartLegend: { flexDirection: "row", gap: 20, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, fontWeight: "500" },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 140, paddingBottom: 12 },
  barGroup: { flex: 1, alignItems: "center" },
  barContainer: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 120 },
  bar: { width: 10, borderRadius: 4 },
  barLabel: { fontSize: 10, marginTop: 6, fontWeight: "500" },
  severityList: { gap: 12 },
});
