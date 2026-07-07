import { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NOTIFICATIONS = [
  { id: '1', title: 'Breaking: Major Climate Deal Signed', body: 'Global leaders reach historic agreement at the climate summit.', time: '5m ago', read: false, icon: 'globe' as const },
  { id: '2', title: 'Tech Stock Surge', body: 'Tech stocks hit new records as AI sector continues to grow.', time: '1h ago', read: false, icon: 'trending-up' as const },
  { id: '3', title: 'New Study Released', body: 'Research shows promising results in quantum computing applications.', time: '3h ago', read: false, icon: 'flask' as const },
  { id: '4', title: 'Sports Update', body: 'Local team advances to championship finals after overtime win.', time: '6h ago', read: true, icon: 'football' as const },
  { id: '5', title: 'Weather Alert', body: 'Heavy rainfall expected in your area this weekend.', time: '8h ago', read: true, icon: 'rainy' as const },
  { id: '6', title: 'Market Report', body: 'Markets close higher amid positive economic data.', time: '12h ago', read: true, icon: 'bar-chart' as const },
  { id: '7', title: 'Election Updates', body: 'New polling data shows shifting voter preferences.', time: '1d ago', read: true, icon: 'megaphone' as const },
  { id: '8', title: 'Health Advisory', body: 'New health guidelines released by national authorities.', time: '2d ago', read: true, icon: 'medkit' as const },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(NOTIFICATIONS);

  const unreadCount = data.filter((n) => !n.read).length;

  const markAllRead = () => {
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
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
      >
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={36} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={styles.emptySub}>No new notifications at this time</Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <Text style={styles.sectionLabel}>New</Text>
            )}
            {data.filter((n) => !n.read).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.unreadCard}
                onPress={() => toggleRead(item.id)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color="#c62828" />
                    <View style={styles.iconDot} />
                  </View>
                  <View style={styles.textBlock}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
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
                    style={styles.readCard}
                    onPress={() => toggleRead(item.id)}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.iconWrap, styles.readIconWrap]}>
                        <Ionicons name={item.icon} size={20} color="#bbb" />
                      </View>
                      <View style={styles.textBlock}>
                        <View style={styles.cardHeader}>
                          <Text style={[styles.cardTitle, styles.readTitle]}>{item.title}</Text>
                        </View>
                        <Text style={[styles.cardBody, { color: '#bbb' }]} numberOfLines={2}>{item.body}</Text>
                        <Text style={[styles.time, { color: '#ddd' }]}>{item.time}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  topBar: {
    backgroundColor: '#c62828',
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
    color: '#c62828',
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
    color: '#999',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptySub: {
    fontSize: 14,
    color: '#bbb',
  },
  unreadCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#c62828',
  },
  readCard: {
    backgroundColor: 'white',
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
    backgroundColor: '#fef0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  readIconWrap: {
    backgroundColor: '#f5f5f5',
  },
  iconDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c62828',
    borderWidth: 1.5,
    borderColor: 'white',
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
    color: '#1a1a2e',
    lineHeight: 20,
  },
  readTitle: {
    fontWeight: '500',
    color: '#999',
  },
  cardBody: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
  },
});
