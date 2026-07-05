import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';

export const HEADER_EXPANDED_HEIGHT = 150;
export const HEADER_MIN_HEIGHT = 60;

interface HomeHeaderProps {
  scrollY: SharedValue<number>;
  unreadCount?: number;
}

export default function HomeHeader({ scrollY, unreadCount = 0 }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_MIN_HEIGHT + insets.top],
      Extrapolate.CLAMP
    );
    return { height };
  });

  const expandedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const greeting = getGreeting();
  const today = getFormattedDate();

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
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

      <Animated.View style={[styles.expandedSection, expandedContentStyle]}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{today}</Text>
      </Animated.View>
    </Animated.View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    zIndex: 100,
    paddingHorizontal: 16,
    overflow: 'hidden',
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
    backgroundColor: '#16213e',
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
