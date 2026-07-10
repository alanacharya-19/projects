import { useState, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const NOTIFICATIONS = [
  { id: '1', title: 'Breaking: Major Climate Deal Signed', body: 'Global leaders reach historic agreement at the climate summit.', time: '5m ago', read: false, icon: 'globe' as const, articleId: '4' },
  { id: '2', title: 'Tech Stock Surge', body: 'Tech stocks hit new records as AI sector continues to grow.', time: '1h ago', read: false, icon: 'trending-up' as const, articleId: '1' },
  { id: '3', title: 'New Study Released', body: 'Research shows promising results in quantum computing applications.', time: '3h ago', read: false, icon: 'flask' as const, articleId: '6' },
  { id: '4', title: 'Sports Update', body: 'Local team advances to championship finals after overtime win.', time: '6h ago', read: true, icon: 'football' as const, articleId: '5' },
  { id: '5', title: 'Weather Alert', body: 'Heavy rainfall expected in your area this weekend.', time: '8h ago', read: true, icon: 'rainy' as const, articleId: undefined },
  { id: '6', title: 'Market Report', body: 'Markets close higher amid positive economic data.', time: '12h ago', read: true, icon: 'bar-chart' as const, articleId: '7' },
  { id: '7', title: 'Election Updates', body: 'New polling data shows shifting voter preferences.', time: '1d ago', read: true, icon: 'megaphone' as const, articleId: '11' },
  { id: '8', title: 'Health Advisory', body: 'New health guidelines released by national authorities.', time: '2d ago', read: true, icon: 'medkit' as const, articleId: '3' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [data, setData] = useState(NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const unreadCount = data.filter((n) => !n.read).length;

  const markAllRead = () => {
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handlePress = (item: typeof NOTIFICATIONS[number]) => {
    toggleRead(item.id);
    if (item.articleId) {
      router.push({ pathname: '/article/[id]', params: { id: item.articleId } });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.markAll}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.iconBg }]}>
              <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>No new notifications at this time</Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <Text style={styles.sectionLabel}>New</Text>
            )}
            {data.filter((n) => !n.read).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.unreadCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
                onPress={() => handlePress(item)}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.categoryBg }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <View style={[styles.iconDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={styles.textBlock}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Text style={[styles.cardBody, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {data.some((n) => n.read) && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Earlier</Text>
                {data.filter((n) => n.read).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.readCard, { backgroundColor: colors.card }]}
                    onPress={() => handlePress(item)}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>
                        <Ionicons name={item.icon} size={20} color={colors.textMuted} />
                      </View>
                      <View style={styles.textBlock}>
                        <View style={styles.cardHeader}>
                          <Text style={[styles.cardTitle, styles.readTitle]}>{item.title}</Text>
                        </View>
                        <Text style={[styles.cardBody, { color: colors.textMuted }]} numberOfLines={2}>{item.body}</Text>
                        <Text style={[styles.time, { color: colors.textMuted }]}>{item.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  countBadge: {
    backgroundColor: '#ffd600',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  markAll: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  body: {
    padding: 20,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 14,
  },
  unreadCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
  },
  readCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  textBlock: {
    flex: 1,
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  readTitle: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
