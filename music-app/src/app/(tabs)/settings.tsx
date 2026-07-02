import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { useLibraryStore } from '../../store/libraryStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useRecentlyPlayedStore } from '../../store/recentlyPlayedStore';
import { SleepTimerModal } from '../../components/SleepTimerModal';
import type { ThemeMode } from '../../types';

type IoniconsName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { theme, setTheme, sleepTimer, setSleepTimer } = useSettingsStore();
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const refreshLibrary = useLibraryStore((s) => s.refreshLibrary);
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const clearRecentlyPlayed = useRecentlyPlayedStore((s) => s.clearRecentlyPlayed);

  const themeOptions: { label: string; value: ThemeMode; icon: IoniconsName }[] = [
    { label: 'Dark', value: 'dark', icon: 'moon' },
    { label: 'Light', value: 'light', icon: 'sunny' },
    { label: 'Dynamic', value: 'dynamic', icon: 'contrast' },
  ];

  const handleClearData = () => {
    Alert.alert('Clear Data', 'This will clear favorites and recently played history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { clearFavorites(); clearRecentlyPlayed(); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {themeOptions.map((option, i) => {
            const isActive = theme === option.value;
            return (
              <TouchableOpacity key={option.value}
                style={[styles.row, i < themeOptions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={() => setTheme(option.value)} activeOpacity={0.6}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isActive ? colors.primary + '20' : colors.surfaceLight }]}>
                    <Ionicons name={option.icon} size={20} color={isActive ? colors.primary : colors.textSecondary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{option.label}</Text>
                </View>
                {isActive && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={13} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Library */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>LIBRARY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => { refreshLibrary(); Alert.alert('Scanning', 'Rescanning your music library...'); }} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Rescan Library</Text>
                <Text style={[styles.rowSub, { color: colors.textTertiary }]}>Refresh your music files</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => router.push('/queue')} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="list" size={20} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>View Queue</Text>
                <Text style={[styles.rowSub, { color: colors.textTertiary }]}>See upcoming tracks</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleClearData} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.error + '18' }]}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.error }]}>Clear All Data</Text>
                <Text style={[styles.rowSub, { color: colors.textTertiary }]}>Remove favorites & history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleep Timer */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>SLEEP TIMER</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.chipRow}>
            {[
              { label: 'Off', minutes: null as number | null },
              { label: '15m', minutes: 15 },
              { label: '30m', minutes: 30 },
              { label: '1hr', minutes: 60 },
            ].map((opt) => {
              const active = sleepTimer === opt.minutes;
              return (
                <TouchableOpacity key={opt.label}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surfaceLight, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => setSleepTimer(opt.minutes)} activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: active ? '#000' : colors.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.primary }]}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="code-slash" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Developer</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textTertiary }]}>Alan Acharya</Text>
          </View>
        </View>
      </View>
      <SleepTimerModal
        visible={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
        onSetTimer={(m) => { setSleepTimer(m); setShowSleepTimer(false); }}
        onCancelTimer={() => { setSleepTimer(null); setShowSleepTimer(false); }}
        activeTimer={sleepTimer}
        colors={colors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingTop: 30, paddingBottom: 12 },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 30, fontWeight: '700' },
  content: { paddingBottom: 140 },

  section: { marginBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, paddingBottom: SIZES.paddingSmall },

  card: { marginHorizontal: SIZES.padding, borderRadius: 14, overflow: 'hidden' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: 14, minHeight: 52 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: SIZES.fontLarge, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 1 },
  rowValue: { fontSize: SIZES.fontMedium, fontWeight: '600' },

  badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 12, gap: SIZES.paddingSmall, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: SIZES.fontMedium, fontWeight: '600' },
});
