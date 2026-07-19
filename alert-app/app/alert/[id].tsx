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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAlertContext } from '@/context/AlertContext';
import DisasterIcon from '@/components/DisasterIcon';
import GradientBackground from '@/components/GradientBackground';
import { Gradients, Spacing, SeverityColors } from '@/constants/theme';
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

  const gradientColors = resolvedMode === 'dark' ? Gradients.alertDark : Gradients.alert;

  if (!alert) {
    return (
      <GradientBackground colors={gradientColors}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 16 }}>
            Alert not found
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground colors={gradientColors}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
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

        {/* Severity Badge */}
        <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
          <Text style={[styles.severityLabel, { color: severityColor }]}>
            {SEVERITY_LABELS[alert.severity] ?? capitalizeWords(alert.severity)}
          </Text>
        </View>

        {/* Alert Type + Title - LinearGradient Hero Card */}
        <LinearGradient
          colors={resolvedMode === 'dark' ? Gradients.cardDark : Gradients.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: severityColor + '20' }]}>
            <DisasterIcon type={alert.type} size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.typeName, { color: colors.textMuted }]}>
              {capitalizeWords(alert.type)}
            </Text>
            <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
          </View>
        </LinearGradient>

        {/* Description - Glassmorphism Card */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {alert.message}
          </Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {[
            { icon: 'time-outline', label: 'Created', value: formatDate(alert.startTime, 'long') },
            { icon: 'refresh-outline', label: 'Last Updated', value: alert.endTime ? formatDate(alert.endTime, 'long') : 'Ongoing' },
            { icon: 'navigate-outline', label: 'Distance', value: formatDistance(alert.radius) },
            { icon: 'globe-outline', label: 'Source', value: alert.source },
          ].map((item, i) => (
            <View
              key={i}
              style={[styles.infoCard, styles.glassCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Affected Area - Glassmorphism Card */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Affected Area</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Coordinates: {alert.coordinates.latitude.toFixed(4)}, {alert.coordinates.longitude.toFixed(4)}
            {'\n'}Radius: {formatDistance(alert.radius)}
          </Text>
        </View>

        {/* Map Preview - Glassmorphism Card */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Ionicons name="map-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.mapPlaceholderText, { color: colors.textMuted }]}>Map View</Text>
          <Text style={[styles.mapPlaceholderSub, { color: colors.textMuted }]}>
            {alert.coordinates.latitude.toFixed(4)}, {alert.coordinates.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Safety Instructions - Glassmorphism Card */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: colors.surface }]}>
          <View style={styles.instructionHeader}>
            <View style={[styles.instructionIconWrap, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Instructions</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.instructionSubtitle, { color: colors.success }]}>DO:</Text>
            {instructions.dos.map((item, i) => (
              <View key={i} style={styles.instructionRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.instructionSubtitle, { color: colors.error }]}>{"DON'T:"}</Text>
            {instructions.donts.map((item, i) => (
              <View key={i} style={styles.instructionRow}>
                <Ionicons name="close-circle" size={16} color={colors.error} />
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Live Updates - Glassmorphism Card */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: colors.surface }]}>
          <View style={styles.instructionHeader}>
            <View style={[styles.instructionIconWrap, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="pulse" size={20} color={colors.info} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Updates</Text>
          </View>
          {liveUpdates.length > 0 ? (
            <View style={{ marginTop: 14 }}>
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
    marginBottom: 14,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 14,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 24,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  glassCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  infoCard: {
    width: '48%',
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  mapPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapPlaceholderSub: {
    fontSize: 13,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instructionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
    paddingRight: 12,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 21,
  },
  updateRow: {
    flexDirection: 'row',
    gap: 12,
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
    paddingBottom: 16,
  },
  updateMessage: {
    fontSize: 15,
    fontWeight: '600',
  },
  updateTime: {
    fontSize: 13,
    marginTop: 2,
  },
  noUpdates: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
});
