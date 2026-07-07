import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const HEADER_HEIGHT = 120;

interface HomeHeaderProps {
  unreadCount?: number;
}

export default function HomeHeader({ unreadCount = 0 }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();

  const greeting = getGreeting();
  const today = getFormattedDate();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Ionicons name="newspaper" size={28} color="white" />
          <Text style={styles.appName}>NewsApp</Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="white" />
          </View>
        </View>
      </View>

      <View style={styles.expandedSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{today}</Text>
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning, Alan';
  if (hour < 18) return 'Good Afternoon, Alan';
  return 'Good Evening, Alan';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c62828',
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#b71c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#a0a0b0',
  },
});
