import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const HEADER_HEIGHT = 120;

interface HomeHeaderProps {
  unreadCount?: number;
}

export default function HomeHeader({ unreadCount = 0 }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const greeting = getGreeting();
  const today = getFormattedDate();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.primary }]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={styles.logoCircle}>
            <Ionicons name="newspaper" size={18} color={colors.primary} />
          </View>
          <Text style={styles.appName}>NewsApp</Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            {unreadCount > 0 && (
              <View style={[styles.badge, { borderColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.expandedSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={styles.date}>{today}</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffd600',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  expandedSection: {
    paddingTop: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
  },
});
