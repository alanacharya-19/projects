import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAlertContext } from '@/context/AlertContext';
import { useAlerts } from '@/hooks/useAlerts';
import AlertCard, { type AlertData } from '@/components/AlertCard';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import GradientBackground from '@/components/GradientBackground';
import { Gradients } from '@/constants/theme';
import { formatDistance, getSeverityColor } from '@/utils/helpers';
import type { Alert, DisasterType, AlertSeverity } from '@/types';
import { DisasterType as DT } from '@/types';

interface FilterChip {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  type?: DisasterType | 'weather' | 'air_quality';
}

const TYPE_FILTERS: FilterChip[] = [
  { key: 'all', label: 'All', icon: 'options' },
  { key: 'earthquakes', label: 'Earthquakes', icon: 'earth', type: DT.EARTHQUAKE },
  { key: 'floods', label: 'Floods', icon: 'water', type: DT.FLOOD },
  { key: 'wildfires', label: 'Wildfires', icon: 'flame', type: DT.WILDFIRE },
  { key: 'storms', label: 'Storms', icon: 'thunderstorm', type: DT.CYCLONE },
  { key: 'heat', label: 'Heat', icon: 'sunny', type: DT.HEATWAVE },
  { key: 'cold', label: 'Cold', icon: 'snow', type: DT.COLD_WAVE },
];

const SEVERITY_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

function alertToAlertData(alert: Alert): AlertData {
  const now = Date.now();
  const diff = now - alert.startTime;
  let timeAgo: string;
  if (diff < 60000) timeAgo = 'just now';
  else if (diff < 3600000) timeAgo = `${Math.floor(diff / 60000)}m ago`;
  else if (diff < 86400000) timeAgo = `${Math.floor(diff / 3600000)}h ago`;
  else timeAgo = `${Math.floor(diff / 86400000)}d ago`;

  return {
    id: alert.id,
    title: alert.title,
    description: alert.message,
    severity: alert.severity as AlertData['severity'],
    type: alert.type,
    timeAgo,
    distance: formatDistance(alert.radius),
  };
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, resolvedMode } = useTheme();
  const { filteredAlerts, dismissAlert, setFilter } = useAlertContext();
  const { isLoading, error, refresh } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('all');

  const filteredBySeverity = useMemo(() => {
    return filteredAlerts.filter((alert) => {
      if (activeSeverityFilter === 'all') return true;
      if (activeSeverityFilter === 'critical') return alert.severity === 'extreme' || alert.severity === 'emergency';
      if (activeSeverityFilter === 'high') return alert.severity === 'severe';
      if (activeSeverityFilter === 'medium') return alert.severity === 'moderate';
      if (activeSeverityFilter === 'low') return alert.severity === 'minor';
      return true;
    });
  }, [filteredAlerts, activeSeverityFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleTypeFilter = useCallback(
    (chip: FilterChip) => {
      setActiveTypeFilter(chip.key);
      if (chip.key === 'all') {
        setFilter({ types: undefined });
      } else if (chip.type) {
        setFilter({ types: [chip.type] });
      }
    },
    [setFilter],
  );

  const handleAlertPress = useCallback(
    (alertData: AlertData) => {
      router.push(`/alert/${alertData.id}` as Href);
    },
    [router],
  );

  const handleDismissAlert = useCallback(
    (alertData: AlertData) => {
      RNAlert.alert(
        'Dismiss Alert',
        'Are you sure you want to dismiss this alert?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Dismiss', style: 'destructive', onPress: () => dismissAlert(alertData.id) },
        ],
      );
    },
    [dismissAlert],
  );

  if (isLoading && filteredAlerts.length === 0) {
    return <LoadingSpinner message="Loading alerts..." colors={{ text: colors.text, textMuted: colors.textMuted, accent: colors.primary }} />;
  }

  if (error && filteredAlerts.length === 0) {
    return (
      <EmptyState
        icon="warning"
        title="Unable to Load Alerts"
        description={error}
        actionText="Retry"
        onAction={onRefresh}
        colors={{
          card: colors.surface,
          cardAlt: colors.surfaceVariant,
          text: colors.text,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
          accent: colors.primary,
        }}
      />
    );
  }

  return (
    <GradientBackground
      colors={resolvedMode === 'dark' ? Gradients.alertDark : Gradients.alert}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            paddingHorizontal: 20,
            marginBottom: 6,
          }}
        >
          Alerts
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            paddingHorizontal: 20,
            marginBottom: 20,
            fontWeight: '500',
          }}
        >
          {filteredBySeverity.length} active {filteredBySeverity.length === 1 ? 'alert' : 'alerts'}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 14,
          }}
        >
          {TYPE_FILTERS.map((chip) => {
            const isActive = activeTypeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.7}
                onPress={() => handleTypeFilter(chip)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 9999,
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                  shadowColor: isActive ? colors.primary : '#000',
                  shadowOffset: { width: 0, height: isActive ? 2 : 0 },
                  shadowOpacity: isActive ? 0.2 : 0.05,
                  shadowRadius: isActive ? 4 : 2,
                  elevation: isActive ? 3 : 1,
                }}
              >
                <Ionicons
                  name={chip.icon}
                  size={16}
                  color={isActive ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 24,
          }}
        >
          {SEVERITY_FILTERS.map((sf) => {
            const isActive = activeSeverityFilter === sf.key;
            return (
              <TouchableOpacity
                key={sf.key}
                activeOpacity={0.7}
                onPress={() => setActiveSeverityFilter(sf.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: isActive ? colors.surfaceVariant : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: isActive ? colors.primary : colors.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  }}
                >
                  {sf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredBySeverity.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.successLight || '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              No active alerts
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              You're all clear! No active alerts match your current filters.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {filteredBySeverity.map((alert) => {
              const alertData = alertToAlertData(alert);
              return (
                <SwipeableAlertCard
                  key={alert.id}
                  alertData={alertData}
                  onPress={handleAlertPress}
                  onDismiss={handleDismissAlert}
                  colors={{
                    card: colors.surface,
                    cardAlt: colors.surfaceVariant,
                    text: colors.text,
                    textSecondary: colors.textSecondary,
                    textMuted: colors.textMuted,
                    severityExtreme: getSeverityColor('extreme' as AlertSeverity),
                    severitySevere: getSeverityColor('severe' as AlertSeverity),
                    severityModerate: getSeverityColor('moderate' as AlertSeverity),
                    severityMinor: getSeverityColor('minor' as AlertSeverity),
                    divider: colors.divider,
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function SwipeableAlertCard({
  alertData,
  onPress,
  onDismiss,
  colors,
}: {
  alertData: AlertData;
  onPress: (data: AlertData) => void;
  onDismiss: (data: AlertData) => void;
  colors: {
    card: string;
    cardAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    severityExtreme: string;
    severitySevere: string;
    severityModerate: string;
    severityMinor: string;
    divider: string;
  };
}) {
  const handleLongPress = useCallback(() => {
    onDismiss(alertData);
  }, [onDismiss, alertData]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={handleLongPress}
      delayLongPress={600}
    >
      <AlertCard alert={alertData} onPress={onPress} colors={colors} />
    </TouchableOpacity>
  );
}
