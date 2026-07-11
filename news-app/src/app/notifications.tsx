import { useState, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { fetchTopHeadlines } from '../services/api';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { notifications, unreadCount, markAllRead, toggleRead, addNotifications } = useNotifications();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchTopHeadlines();
    addNotifications(data);
    setRefreshing(false);
  }, [addNotifications]);

  const handlePress = (item: typeof notifications[number]) => {
    toggleRead(item.id);
    router.push({ pathname: '/article/[id]', params: { id: item.articleId } });
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
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.iconBg }]}>
              <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Pull down to check for new articles</Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <Text style={styles.sectionLabel}>New</Text>
            )}
            {notifications.filter((n) => !n.read).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.unreadCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
                onPress={() => handlePress(item)}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.categoryBg }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <View style={[styles.iconDot, { backgroundColor: colors.primary, borderColor: colors.card }]} />
                  </View>
                  <View style={styles.textBlock}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                    </View>
                    <Text style={[styles.cardBody, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                    <Text style={[styles.time, { color: colors.textMuted }]}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {notifications.some((n) => n.read) && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Earlier</Text>
                {notifications.filter((n) => n.read).map((item) => (
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
                          <Text style={[styles.cardTitle, { color: colors.textMuted, fontWeight: '500' }]}>{item.title}</Text>
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
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
});
