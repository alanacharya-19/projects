import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import SearchBar from "@/components/SearchBar";
import SurvivalStepCard from "@/components/SurvivalStepCard";
import SectionHeader from "@/components/SectionHeader";
import { Spacing, FontSizes, BorderRadius, Shadows } from "@/constants/theme";
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
  const { colors } = useTheme();
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
      case "before":
        return guide.beforeSteps;
      case "during":
        return guide.duringSteps;
      case "after":
        return guide.afterSteps;
    }
  };

  const renderGuideCard = (guide: SurvivalGuide) => {
    const isExpanded = expandedId === guide.id;
    const steps = getSteps(guide, activePhase);
    const phaseColor = PHASE_COLORS[activePhase];

    return (
      <View
        key={guide.id}
        style={[styles.guideCard, { backgroundColor: colors.surface, ...Shadows.md }]}
      >
        <TouchableOpacity
          style={styles.guideHeader}
          onPress={() => toggleExpand(guide.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.guideIcon}>{guide.icon}</Text>
          <View style={styles.guideHeaderText}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>{guide.title}</Text>
            <Text style={[styles.guideDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {guide.description}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.guideContent}>
            {/* Phase Tabs */}
            <View style={[styles.phaseTabs, { backgroundColor: colors.surfaceVariant }]}>
              {PHASE_OPTIONS.map((phase) => (
                <TouchableOpacity
                  key={phase.key}
                  style={[
                    styles.phaseTab,
                    activePhase === phase.key && {
                      backgroundColor:
                        phase.key === "before"
                          ? "#DCFCE7"
                          : phase.key === "during"
                          ? "#FEF3C7"
                          : "#E0F2FE",
                    },
                  ]}
                  onPress={() => setActivePhase(phase.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={phase.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={
                      activePhase === phase.key ? PHASE_COLORS[phase.key] : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.phaseTabText,
                      {
                        color:
                          activePhase === phase.key
                            ? PHASE_COLORS[phase.key]
                            : colors.textMuted,
                      },
                    ]}
                  >
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
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    accent: phaseColor,
                  }}
                />
              ))}
            </View>

            {/* Emergency Kit */}
            <View style={styles.subSection}>
              <SectionHeader
                title="Emergency Kit"
                colors={{ text: colors.text, accent: colors.primary, textMuted: colors.textMuted }}
              />
              {guide.emergencyKit.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.kitItem, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Ionicons
                    name={item.essential ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={item.essential ? colors.success : colors.textMuted}
                  />
                  <View style={styles.kitItemText}>
                    <Text style={[styles.kitItemName, { color: colors.text }]}>{item.item}</Text>
                    <Text style={[styles.kitItemQty, { color: colors.textMuted }]}>
                      {item.quantity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Dos */}
            <View style={styles.subSection}>
              <SectionHeader
                title="Do's"
                colors={{ text: colors.text, accent: colors.success, textMuted: colors.textMuted }}
              />
              {guide.dos.map((item, idx) => (
                <View key={idx} style={styles.dosDontsItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={[styles.dosDontsText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Don'ts */}
            <View style={styles.subSection}>
              <SectionHeader
                title="Don'ts"
                colors={{ text: colors.text, accent: colors.error, textMuted: colors.textMuted }}
              />
              {guide.donts.map((item, idx) => (
                <View key={idx} style={styles.dosDontsItem}>
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                  <Text style={[styles.dosDontsText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Survival Guide</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Essential knowledge for any disaster
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search guides..."
            colors={{
              card: colors.surface,
              text: colors.text,
              textMuted: colors.textMuted,
              cardAlt: colors.surfaceVariant,
              accent: colors.primary,
            }}
          />
        </View>

        {/* Offline Indicator */}
        <View style={[styles.offlineIndicator, { backgroundColor: colors.successLight }]}>
          <Ionicons name="cloud-offline" size={16} color={colors.success} />
          <Text style={[styles.offlineText, { color: colors.success }]}>
            Available offline
          </Text>
        </View>

        {/* Guide Cards */}
        <View style={styles.guidesList}>
          {guides.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No guides found
              </Text>
            </View>
          ) : (
            guides.map(renderGuideCard)
          )}
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
  searchContainer: {
    marginBottom: Spacing.md,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  offlineText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  guidesList: {
    gap: Spacing.lg,
  },
  guideCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  guideIcon: {
    fontSize: 36,
  },
  guideHeaderText: {
    flex: 1,
  },
  guideTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  guideDesc: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  guideContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  phaseTabs: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  phaseTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  phaseTabText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  stepsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  subSection: {
    marginBottom: Spacing.xl,
  },
  kitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  kitItemText: {
    flex: 1,
  },
  kitItemName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  kitItemQty: {
    fontSize: FontSizes.sm,
  },
  dosDontsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  dosDontsText: {
    fontSize: FontSizes.md,
    flex: 1,
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
  },
});
