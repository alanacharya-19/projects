import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAlertContext } from '@/context/AlertContext';
import DisasterIcon from '@/components/DisasterIcon';
import GradientBackground from '@/components/GradientBackground';
import { Spacing, BorderRadius, FontSizes, Shadows, SeverityColors } from '@/constants/theme';
import { formatDate, formatDistance, capitalizeWords } from '@/utils/helpers';

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  severe: 'Severe',
  extreme: 'Extreme',
  emergency: 'Emergency',
};

const SURVIVAL_INSTRUCTIONS: Record<string, { dos: string[]; donts: string[] }> = {
  earthquake: {
    dos: [
      'Drop, Cover, and Hold On',
      'Stay indoors if you are inside',
      'Move away from windows and heavy objects',
      'If outdoors, move to an open area',
      'Have an emergency kit ready',
    ],
    donts: [
      'Do not use elevators',
      'Do not run outside during shaking',
      'Do not stand near buildings or power lines',
      'Do not light matches or candles (gas leaks)',
    ],
  },
  flood: {
    dos: [
      'Move to higher ground immediately',
      'Turn off electricity and gas if instructed',
      'Prepare sandbags if time permits',
      'Keep emergency supplies ready',
    ],
    donts: [
      'Do not walk or drive through flood waters',
      'Do not touch electrical equipment in water',
      'Do not drink flood water (contaminated)',
      'Do not ignore evacuation orders',
    ],
  },
  wildfire: {
    dos: [
      'Evacuate immediately if ordered',
      'Close all windows and doors',
      'Wet vegetation around your home',
      'Wear protective clothing (long sleeves, mask)',
    ],
    donts: [
      'Do not attempt to outrun the fire uphill',
      'Do not return home until authorities say it is safe',
      'Do not use water hoses once fire is near',
      'Do not shelter in a pool or water tank',
    ],
  },
  storm: {
    dos: [
      'Stay indoors and away from windows',
      'Charge all electronic devices',
      'Fill bathtubs and containers with water',
      'Secure outdoor furniture and objects',
    ],
    donts: [
      'Do not go outside during the storm',
      'Do not use landline phones during lightning',
      'Do not take shelter under trees',
      'Do not drive through standing water',
    ],
  },
};

const DEFAULT_INSTRUCTIONS = {
  dos: [
    'Stay calm and follow local authorities\' instructions',
    'Keep emergency contacts accessible',
    'Monitor official channels for updates',
    'Have your emergency kit ready',
  ],
  donts: [
    'Do not panic',
    'Do not spread unverified information',
    'Do not ignore official warnings',
    'Do not put yourself at unnecessary risk',
  ],
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode } = useTheme();
  const { alerts, markAsRead } = useAlertContext();

  const alert = useMemo(() => alerts.find((a) => a.id === id) ?? null, [alerts, id]);

  React.useEffect(() => {
    if (alert) markAsRead(alert.id);
  }, [alert, markAsRead]);

  const severityColor = useMemo(() => {
    if (!alert) return colors.primary;
    return SeverityColors[alert.severity as keyof typeof SeverityColors] ?? colors.primary;
  }, [alert, colors.primary]);

  const instructions = useMemo(() => {
    if (!alert) return DEFAULT_INSTRUCTIONS;
    const typeKey = alert.type as string;
    const known = SURVIVAL_INSTRUCTIONS[typeKey] ?? SURVIVAL_INSTRUCTIONS[typeKey.replace('cold_wave', 'flood')];
    return known ?? DEFAULT_INSTRUCTIONS;
  }, [alert]);

  const handleShare = useCallback(async () => {
    if (!alert) return;
    try {
      await Share.share({
        title: `Alert: ${alert.title}`,
        message: `${alert.title}\n\n${alert.message}\n\nSeverity: ${SEVERITY_LABELS[alert.severity] ?? alert.severity}\nShared via AlertGuard`,
      });
    } catch {
      // User cancelled or share failed
    }
  }, [alert]);

  const liveUpdates = useMemo(() => {
    if (!alert) return [];
    return [
      { time: alert.startTime, message: 'Alert issued' },
      ...(alert.endTime ? [{ time: alert.endTime, message: 'Alert expired/updated' }] : []),
    ];
  }, [alert]);

  if (!alert) {
    return (
      <GradientBackground
        colors={resolvedMode === 'dark' ? ['#0F172A', '#1E293B'] as const : ['#F8FAFC', '#F1F5F9'] as const}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: FontSizes.lg, marginTop: Spacing.lg }}>
            Alert not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: Spacing.xl,
              backgroundColor: colors.primary,
              paddingHorizontal: Spacing.xxl,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.lg,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? ['#0F172A', '#1E293B'] as const : ['#FEF2F2', '#FFF7ED', '#F8FAFC'] as const}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back and share */}
        <View style={[styles.header, { paddingHorizontal: Spacing.lg }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Alert Details</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: Spacing.lg }}>
          {/* Severity Badge */}
          <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
            <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
            <Text style={[styles.severityLabel, { color: severityColor }]}>
              {SEVERITY_LABELS[alert.severity] ?? capitalizeWords(alert.severity)}
            </Text>
          </View>

          {/* Alert Type + Title */}
          <View style={[styles.typeRow, { backgroundColor: colors.surface }]}>
            <View style={[styles.typeIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <DisasterIcon type={alert.type} size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeName, { color: colors.textMuted }]}>
                {capitalizeWords(alert.type)}
              </Text>
              <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {alert.message}
            </Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Created</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(alert.startTime, 'long')}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Last Updated</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {alert.endTime ? formatDate(alert.endTime, 'long') : 'Ongoing'}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Distance</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDistance(alert.radius)}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Source</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{alert.source}</Text>
            </View>
          </View>

          {/* Affected Area */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Affected Area</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              Coordinates: {alert.coordinates.latitude.toFixed(4)}, {alert.coordinates.longitude.toFixed(4)}
              {'\n'}Radius: {formatDistance(alert.radius)}
            </Text>
          </View>

          {/* Map Preview */}
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Ionicons name="map-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.mapPlaceholderText, { color: colors.textMuted }]}>Map View</Text>
            <Text style={[styles.mapPlaceholderSub, { color: colors.textMuted }]}>
              {alert.coordinates.latitude.toFixed(4)}, {alert.coordinates.longitude.toFixed(4)}
            </Text>
          </View>

          {/* Safety Instructions */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.instructionHeader}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Instructions</Text>
            </View>
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[styles.instructionSubtitle, { color: colors.success }]}>DO:</Text>
              {instructions.dos.map((item, i) => (
                <View key={i} style={styles.instructionRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[styles.instructionSubtitle, { color: colors.error }]}>{"DON'T:"}</Text>
              {instructions.donts.map((item, i) => (
                <View key={i} style={styles.instructionRow}>
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Live Updates */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.instructionHeader}>
              <Ionicons name="pulse" size={22} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Updates</Text>
            </View>
            {liveUpdates.length > 0 ? (
              <View style={{ marginTop: Spacing.md }}>
                {liveUpdates.map((update, i) => (
                  <View key={i} style={styles.updateRow}>
                    <View style={styles.updateTimeline}>
                      <View style={[styles.updateDot, { backgroundColor: colors.info }]} />
                      {i < liveUpdates.length - 1 && (
                        <View style={[styles.updateLine, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                    <View style={styles.updateContent}>
                      <Text style={[styles.updateMessage, { color: colors.text }]}>{update.message}</Text>
                      <Text style={[styles.updateTime, { color: colors.textMuted }]}>
                        {formatDate(update.time, 'long')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noUpdates, { color: colors.textMuted }]}>
                No live updates available at this time.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  alertTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    lineHeight: 28,
  },
  section: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
    ...Shadows.sm,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  mapPlaceholder: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  mapPlaceholderText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  mapPlaceholderSub: {
    fontSize: FontSizes.sm,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructionSubtitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.md,
  },
  instructionText: {
    fontSize: FontSizes.md,
    flex: 1,
    lineHeight: 20,
  },
  updateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  updateTimeline: {
    alignItems: 'center',
    width: 16,
  },
  updateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  updateLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  updateContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  updateMessage: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  updateTime: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  noUpdates: {
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
