import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Shadows } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.78;

interface SidebarItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
}

const MENU_ITEMS: SidebarItem[] = [
  { id: 'home', title: 'Home', icon: 'home', iconColor: '#6366F1', route: '/' },
  { id: 'alerts', title: 'Alerts', icon: 'notifications', iconColor: '#EF4444', route: '/alerts' },
  { id: 'forecast', title: 'Forecast', icon: 'cloud', iconColor: '#3B82F6', route: '/forecast' },
  { id: 'emergency', title: 'Emergency SOS', icon: 'alert-circle', iconColor: '#DC2626', route: '/emergency' },
  { id: 'earthquake', title: 'Earthquake Monitor', icon: 'earth', iconColor: '#EA580C', route: '/earthquake-monitor' },
  { id: 'flood', title: 'Flood Monitor', icon: 'water', iconColor: '#2563EB', route: '/flood-monitor' },
  { id: 'wildfire', title: 'Wildfire Monitor', icon: 'flame', iconColor: '#DC2626', route: '/wildfire-monitor' },
  { id: 'survival', title: 'Survival Guide', icon: 'book', iconColor: '#16A34A', route: '/survival-guide' },
  { id: 'services', title: 'Nearby Services', icon: 'location', iconColor: '#4F46E5', route: '/nearby-services' },
  { id: 'statistics', title: 'Statistics', icon: 'bar-chart', iconColor: '#7C3AED', route: '/statistics' },
  { id: 'feed', title: 'Global Feed', icon: 'globe', iconColor: '#0D9488', route: '/global-feed' },
  { id: 'ai', title: 'AI Assistant', icon: 'chatbubble-ellipses', iconColor: '#7C3AED', route: '/ai-chat' },
  { id: 'settings', title: 'Settings', icon: 'settings', iconColor: '#64748B', route: '/settings' },
];

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentRoute?: string;
}

export default function Sidebar({ visible, onClose, onNavigate, currentRoute }: SidebarProps) {
  const { colors, resolvedMode } = useTheme();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isDark = resolvedMode === 'dark';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 28,
          stiffness: 300,
          mass: 0.8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -SIDEBAR_WIDTH,
          useNativeDriver: true,
          damping: 28,
          stiffness: 300,
          mass: 0.8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  const handleItemPress = (route: string) => {
    onClose();
    setTimeout(() => onNavigate(route), 150);
  };

  const sidebarBg = isDark ? '#0A1830' : '#FFFFFF';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <>
      {visible && <StatusBar barStyle="light-content" />}

      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={styles.overlayPress} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: sidebarBg,
            transform: [{ translateX }],
            ...Shadows.xl,
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <LinearGradient
            colors={isDark ? ['#2EA8FF', '#00D4FF'] : ['#2EA8FF', '#1A8FEE']}
            style={styles.logoCircle}
          >
            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.appName, { color: colors.text }]}>{APP_CONFIG.NAME}</Text>
            <Text style={[styles.appVersion, { color: colors.textMuted }]}>
              v{APP_CONFIG.VERSION}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}
        >
          {MENU_ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  isActive && {
                    backgroundColor: isDark
                      ? 'rgba(46, 168, 255, 0.12)'
                      : 'rgba(46, 168, 255, 0.08)',
                  },
                ]}
                activeOpacity={0.6}
                onPress={() => handleItemPress(item.route)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isActive
                        ? item.iconColor + '18'
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? item.iconColor : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    {
                      color: isActive ? colors.text : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.title}
                </Text>
                {isActive && (
                  <View style={[styles.activeDot, { backgroundColor: item.iconColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.sidebarFooter}>
          <Text style={[styles.footerTagline, { color: colors.textMuted }]}>
            Stay safe. Stay informed.
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  overlayPress: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 101,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    flex: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerTagline: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
