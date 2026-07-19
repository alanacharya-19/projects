import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import SearchBar from "@/components/SearchBar";
import SurvivalStepCard from "@/components/SurvivalStepCard";
import GradientBackground from "@/components/GradientBackground";
import { Gradients, Shadows } from "@/constants/theme";
import { SURVIVAL_GUIDES } from "@/constants/survival";
import type { SurvivalGuide, SurvivalStep } from "@/types";

type Phase = "before" | "during" | "after";

const PHASE_OPTIONS: { key: Phase; label: string; icon: string }[] = [
  { key: "before", label: "Before", icon: "shield-checkmark" },
  { key: "during", label: "During", icon: "warning" },
  { key: "after", label: "After", icon: "checkmark-circle" },
];

const PHASE_COLORS: Record<Phase, string> = {
  before: "#16A34A",
  during: "#F59E0B",
  after: "#0EA5E9",
};

export default function SurvivalGuideScreen() {
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<Phase>("before");

  const guides = useMemo(() => {
    if (!search.trim()) return SURVIVAL_GUIDES;
    const q = search.toLowerCase();
    return SURVIVAL_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.disasterType.toLowerCase().includes(q)
    );
  }, [search]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const getSteps = (guide: SurvivalGuide, phase: Phase): SurvivalStep[] => {
    switch (phase) {
      case "before": return guide.beforeSteps;
      case "during": return guide.duringSteps;
      case "after": return guide.afterSteps;
    }
  };

  const renderGuideCard = (guide: SurvivalGuide) => {
    const isExpanded = expandedId === guide.id;
    const steps = getSteps(guide, activePhase);
    const phaseColor = PHASE_COLORS[activePhase];

    return (
      <View key={guide.id} style={[styles.guideCard, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.guideHeader} onPress={() => toggleExpand(guide.id)} activeOpacity={0.7}>
          <Text style={styles.guideIcon}>{guide.icon}</Text>
          <View style={styles.guideHeaderText}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>{guide.title}</Text>
            <Text style={[styles.guideDesc, { color: colors.textSecondary }]} numberOfLines={2}>{guide.description}</Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.guideContent}>
            {/* Phase Tabs */}
            <View style={[styles.phaseTabs, { backgroundColor: colors.surfaceVariant }]}>
              {PHASE_OPTIONS.map((phase) => (
                <TouchableOpacity
                  key={phase.key}
                  style={[styles.phaseTab, activePhase === phase.key && {
                    backgroundColor: phase.key === "before" ? "#DCFCE7" : phase.key === "during" ? "#FEF3C7" : "#E0F2FE",
                    ...Shadows.sm,
                  }]}
                  onPress={() => setActivePhase(phase.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={phase.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={activePhase === phase.key ? PHASE_COLORS[phase.key] : colors.textMuted}
                  />
                  <Text style={[styles.phaseTabText, { color: activePhase === phase.key ? PHASE_COLORS[phase.key] : colors.textMuted }]}>
                    {phase.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Steps */}
            <View style={styles.stepsList}>
              {steps.map((step) => (
                <SurvivalStepCard
                  key={`${guide.id}-${activePhase}-${step.order}`}
                  step={step.order}
                  title={step.title}
                  description={step.description}
                  colors={{ card: colors.surface, cardAlt: colors.surfaceVariant, text: colors.text, textSecondary: colors.textSecondary, accent: phaseColor }}
                />
              ))}
            </View>

            {/* Emergency Kit */}
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>Emergency Kit</Text>
            {guide.emergencyKit.map((item, idx) => (
              <View key={idx} style={[styles.kitItem, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name={item.essential ? "checkmark-circle" : "ellipse-outline"} size={20} color={item.essential ? colors.success : colors.textMuted} />
                <View style={styles.kitItemText}>
                  <Text style={[styles.kitItemName, { color: colors.text }]}>{item.item}</Text>
                  <Text style={[styles.kitItemQty, { color: colors.textMuted }]}>{item.quantity}</Text>
                </View>
              </View>
            ))}

            {/* Do's & Don'ts in two columns */}
            <View style={styles.dosDontsContainer}>
              <View style={styles.dosDontsColumn}>
                <Text style={[styles.dosDontsTitle, { color: colors.success }]}>{`Do's`}</Text>
                {guide.dos.map((item, idx) => (
                  <View key={idx} style={styles.dosDontsItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.dosDontsText, { color: colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.dosDontsDivider, { backgroundColor: colors.border }]} />
              <View style={styles.dosDontsColumn}>
                <Text style={[styles.dosDontsTitle, { color: colors.error }]}>{`Don'ts`}</Text>
                {guide.donts.map((item, idx) => (
                  <View key={idx} style={styles.dosDontsItem}>
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                    <Text style={[styles.dosDontsText, { color: colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? Gradients.forecastDark : Gradients.forecast}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Survival Guide</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Essential knowledge for any disaster</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search guides..."
            colors={{ card: colors.surface, text: colors.text, textMuted: colors.textMuted, cardAlt: colors.surfaceVariant, accent: colors.primary }} />
        </View>

        {/* Offline Indicator */}
        <LinearGradient
          colors={resolvedMode === 'dark' ? Gradients.glassDark : Gradients.glass}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.offlineIndicator}
        >
          <Ionicons name="cloud-offline" size={16} color={colors.success} />
          <Text style={[styles.offlineText, { color: colors.success }]}>Available offline</Text>
        </LinearGradient>

        {/* Guide Cards */}
        <View style={styles.guidesList}>
          {guides.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="search" size={48} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No guides found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Try adjusting your search terms</Text>
            </View>
          ) : (
            guides.map(renderGuideCard)
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  headerSubtitle: { fontSize: 15, fontWeight: "500", marginBottom: 16 },
  searchContainer: { marginBottom: 12 },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
  },
  offlineText: { fontSize: 13, fontWeight: "600" },
  guidesList: { gap: 14 },
  guideCard: { borderRadius: 20, overflow: "hidden", ...Shadows.sm },
  guideHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  guideIcon: { fontSize: 36 },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  guideDesc: { fontSize: 13, lineHeight: 18 },
  guideContent: { paddingHorizontal: 16, paddingBottom: 20 },
  phaseTabs: { flexDirection: "row", borderRadius: 16, padding: 4, marginBottom: 20 },
  phaseTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
  },
  phaseTabText: { fontSize: 13, fontWeight: "600" },
  stepsList: { gap: 10, marginBottom: 20 },
  subSectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  kitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  kitItemText: { flex: 1 },
  kitItemName: { fontSize: 14, fontWeight: "600" },
  kitItemQty: { fontSize: 12 },
  dosDontsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  dosDontsColumn: { flex: 1, gap: 8 },
  dosDontsDivider: { width: StyleSheet.hairlineWidth },
  dosDontsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  dosDontsItem: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  dosDontsText: { fontSize: 13, flex: 1, lineHeight: 18 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14 },
});
