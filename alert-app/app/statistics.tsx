import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import StatBar from "@/components/StatBar";
import SectionHeader from "@/components/SectionHeader";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";

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
      { label: "Mon", temp: 31, rain: 3 },
      { label: "Tue", temp: 33, rain: 5 },
      { label: "Wed", temp: 30, rain: 1 },
      { label: "Thu", temp: 35, rain: 0 },
      { label: "Fri", temp: 29, rain: 8 },
      { label: "Sat", temp: 34, rain: 2 },
      { label: "Sun", temp: 32, rain: 4 },
    ],
    severity: { minor: 3, moderate: 2, severe: 1, extreme: 0, emergency: 0 },
  },
  month: {
    weather: { avgTemp: 30, totalRainfall: 85, avgHumidity: 72, avgWindSpeed: 12 },
    disasters: { earthquakes: 8, floods: 4, wildfires: 1 },
    monthlyBars: [
      { label: "W1", temp: 29, rain: 22 },
      { label: "W2", temp: 31, rain: 18 },
      { label: "W3", temp: 33, rain: 25 },
      { label: "W4", temp: 28, rain: 20 },
    ],
    severity: { minor: 12, moderate: 8, severe: 4, extreme: 1, emergency: 0 },
  },
  year: {
    weather: { avgTemp: 27, totalRainfall: 1240, avgHumidity: 65, avgWindSpeed: 15 },
    disasters: { earthquakes: 42, floods: 18, wildfires: 6 },
    monthlyBars: [
      { label: "Jan", temp: 18, rain: 20 },
      { label: "Feb", temp: 21, rain: 25 },
      { label: "Mar", temp: 26, rain: 30 },
      { label: "Apr", temp: 32, rain: 15 },
      { label: "May", temp: 36, rain: 35 },
      { label: "Jun", temp: 34, rain: 120 },
      { label: "Jul", temp: 31, rain: 280 },
      { label: "Aug", temp: 30, rain: 260 },
      { label: "Sep", temp: 31, rain: 180 },
      { label: "Oct", temp: 29, rain: 60 },
      { label: "Nov", temp: 24, rain: 25 },
      { label: "Dec", temp: 20, rain: 10 },
    ],
    severity: { minor: 58, moderate: 42, severe: 22, extreme: 8, emergency: 2 },
  },
};

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<TimePeriod>("month");

  const data = useMemo(() => MOCK_DATA[period], [period]);

  const severityItems = [
    { label: "Minor", value: data.severity.minor, color: "#3B82F6", max: 60 },
    { label: "Moderate", value: data.severity.moderate, color: "#F59E0B", max: 45 },
    { label: "Severe", value: data.severity.severe, color: "#F97316", max: 25 },
    { label: "Extreme", value: data.severity.extreme, color: "#DC2626", max: 10 },
    { label: "Emergency", value: data.severity.emergency, color: "#7C2D12", max: 5 },
  ];

  const maxRain = Math.max(...data.monthlyBars.map((b) => b.rain), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Statistics</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Weather & disaster analytics
          </Text>
        </View>

        {/* Time Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.surfaceVariant }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodTab,
                period === p.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodTabText,
                  { color: period === p.key ? "#FFFFFF" : colors.textMuted },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weather Trends */}
        <View style={styles.section}>
          <SectionHeader
            title="Weather Trends"
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={styles.statsGrid}>
            <StatBar
              label="Avg Temperature"
              value={`${data.weather.avgTemp}°C`}
              maxValue={50}
              color={colors.error}
              colors={{
                card: colors.surface,
                text: colors.text,
                textSecondary: colors.textSecondary,
                textMuted: colors.textMuted,
                barTrack: colors.surfaceVariant,
                accent: colors.primary,
              }}
            />
            <StatBar
              label="Total Rainfall"
              value={`${data.weather.totalRainfall}mm`}
              maxValue={period === "year" ? 1500 : period === "month" ? 100 : 20}
              color={colors.info}
              colors={{
                card: colors.surface,
                text: colors.text,
                textSecondary: colors.textSecondary,
                textMuted: colors.textMuted,
                barTrack: colors.surfaceVariant,
                accent: colors.primary,
              }}
            />
            <StatBar
              label="Avg Humidity"
              value={`${data.weather.avgHumidity}%`}
              maxValue={100}
              color={colors.primary}
              colors={{
                card: colors.surface,
                text: colors.text,
                textSecondary: colors.textSecondary,
                textMuted: colors.textMuted,
                barTrack: colors.surfaceVariant,
                accent: colors.primary,
              }}
            />
            <StatBar
              label="Avg Wind Speed"
              value={`${data.weather.avgWindSpeed} km/h`}
              maxValue={80}
              color={colors.secondary}
              colors={{
                card: colors.surface,
                text: colors.text,
                textSecondary: colors.textSecondary,
                textMuted: colors.textMuted,
                barTrack: colors.surfaceVariant,
                accent: colors.primary,
              }}
            />
          </View>
        </View>

        {/* Disasters Count */}
        <View style={styles.section}>
          <SectionHeader
            title="Disaster Events"
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={styles.disasterCards}>
            <View style={[styles.disasterCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
              <Ionicons name="earth" size={28} color="#92400E" />
              <Text style={[styles.disasterCount, { color: colors.text }]}>
                {data.disasters.earthquakes}
              </Text>
              <Text style={[styles.disasterLabel, { color: colors.textMuted }]}>Earthquakes</Text>
            </View>
            <View style={[styles.disasterCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
              <Ionicons name="water" size={28} color="#1D4ED8" />
              <Text style={[styles.disasterCount, { color: colors.text }]}>
                {data.disasters.floods}
              </Text>
              <Text style={[styles.disasterLabel, { color: colors.textMuted }]}>Floods</Text>
            </View>
            <View style={[styles.disasterCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
              <Ionicons name="flame" size={28} color="#DC2626" />
              <Text style={[styles.disasterCount, { color: colors.text }]}>
                {data.disasters.wildfires}
              </Text>
              <Text style={[styles.disasterLabel, { color: colors.textMuted }]}>Wildfires</Text>
            </View>
          </View>
        </View>

        {/* Monthly Data Chart */}
        <View style={styles.section}>
          <SectionHeader
            title={period === "week" ? "Daily Overview" : period === "month" ? "Weekly Overview" : "Monthly Overview"}
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={[styles.chartCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
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
                      <View
                        style={[
                          styles.bar,
                          styles.tempBar,
                          {
                            height: tempHeight,
                            backgroundColor: colors.error,
                            opacity: 0.8,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          styles.rainBar,
                          {
                            height: barHeight,
                            backgroundColor: colors.info,
                            opacity: 0.8,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Severity Distribution */}
        <View style={styles.section}>
          <SectionHeader
            title="Severity Distribution"
            colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
          />
          <View style={styles.severityList}>
            {severityItems.map((item) => (
              <StatBar
                key={item.label}
                label={item.label}
                value={String(item.value)}
                maxValue={item.max}
                color={item.color}
                colors={{
                  card: colors.surface,
                  text: colors.text,
                  textSecondary: colors.textSecondary,
                  textMuted: colors.textMuted,
                  barTrack: colors.surfaceVariant,
                  accent: colors.primary,
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  periodTabText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  disasterCards: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  disasterCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  disasterCount: {
    fontSize: FontSizes.xxxl,
    fontWeight: "800",
  },
  disasterLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    textAlign: "center",
  },
  chartCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  chartLegend: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSizes.sm,
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingBottom: Spacing.md,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 120,
  },
  bar: {
    width: 10,
    borderRadius: 4,
  },
  tempBar: {},
  rainBar: {},
  barLabel: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  severityList: {
    gap: Spacing.md,
  },
});
