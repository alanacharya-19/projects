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
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
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
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAll}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={styles.emptySub}>No new notifications</Text>
          </View>
        ) : (
          data.map((item, index) => {
            const isFirstUnread = !item.read && (index === 0 || data[index - 1]?.read);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => toggleRead(item.id)}
              >
                {isFirstUnread && index > 0 && <View style={styles.separator} />}
                <View style={styles.cardContent}>
                  <View style={[styles.iconCircle, !item.read && styles.unreadIcon]}>
                    <Ionicons name={item.icon} size={20} color={item.read ? '#999' : '#c62828'} />
                  </View>
                  <View style={styles.textBlock}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, !item.read && styles.unreadText]}>
                        {item.title}
                      </Text>
                      {!item.read && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  topBar: {
    backgroundColor: '#c62828',
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  markAll: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  body: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
  },
  card: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unreadCard: {
    backgroundColor: '#fff8f8',
  },
  separator: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginBottom: 14,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIcon: {
    backgroundColor: '#fef0f0',
  },
  textBlock: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  unreadText: {
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c62828',
  },
  cardBody: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#bbb',
  },
});
