import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.78;

interface SidebarItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  pngIcon?: number;
  iconColor: string;
  route: string;
}

const MENU_ITEMS: SidebarItem[] = [
  { id: 'home', title: 'Home', icon: 'home', iconColor: '#3B82F6', route: '/' },
  { id: 'alerts', title: 'Alerts', icon: 'notifications', pngIcon: require('../../assets/icons/alerts.png'), iconColor: '#EF4444', route: '/alerts' },
  { id: 'forecast', title: 'Forecast', icon: 'cloud', pngIcon: require('../../assets/icons/weather.png'), iconColor: '#3B82F6', route: '/forecast' },
  { id: 'emergency', title: 'Emergency SOS', icon: 'alert-circle', pngIcon: require('../../assets/icons/sos.png'), iconColor: '#EF4444', route: '/emergency' },
  { id: 'earthquake', title: 'Earthquake Monitor', icon: 'earth', pngIcon: require('../../assets/icons/earthquake.png'), iconColor: '#FF3B30', route: '/earthquake-monitor' },
  { id: 'flood', title: 'Flood Monitor', icon: 'water', pngIcon: require('../../assets/icons/flood.png'), iconColor: '#2E7DFF', route: '/flood-monitor' },
  { id: 'wildfire', title: 'Wildfire Monitor', icon: 'flame', pngIcon: require('../../assets/icons/wildfire.png'), iconColor: '#FF9500', route: '/wildfire-monitor' },
  { id: 'map', title: 'Live Map', icon: 'map', pngIcon: require('../../assets/icons/map.png'), iconColor: '#22C55E', route: '/map' },
  { id: 'survival', title: 'Survival Guide', icon: 'book', iconColor: '#34C759', route: '/survival-guide' },
  { id: 'services', title: 'Nearby Services', icon: 'location', pngIcon: require('../../assets/icons/NearbyShelter.png'), iconColor: '#3B82F6', route: '/nearby-services' },
  { id: 'statistics', title: 'Statistics', icon: 'bar-chart', iconColor: '#8B5CF6', route: '/statistics' },
  { id: 'feed', title: 'Global Feed', icon: 'globe', iconColor: '#00C2FF', route: '/global-feed' },
  { id: 'ai', title: 'AI Assistant', icon: 'chatbubble-ellipses', pngIcon: require('../../assets/icons/aiAssistant.png'), iconColor: '#8B5CF6', route: '/ai-chat' },
];

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentRoute?: string;
}

export default function Sidebar({ visible, onClose, onNavigate, currentRoute }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 26,
          stiffness: 280,
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
          damping: 26,
          stiffness: 280,
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
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Image source={require('../../assets/appIcon.png')} style={styles.logoImage} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.appName}>GeoAlert</Text>
            <Text style={styles.appVersion}>v1.0.0</Text>
          </View>
        </View>

        <View style={styles.divider} />

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
                  isActive && styles.menuItemActive,
                ]}
                activeOpacity={0.6}
                onPress={() => handleItemPress(item.route)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isActive ? `${item.iconColor}18` : '#F1F5F9' },
                  ]}
                >
                  {item.pngIcon ? (
                    <Image source={item.pngIcon} style={[styles.menuPngIcon, isActive && { tintColor: item.iconColor }]} />
                  ) : (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isActive ? item.iconColor : '#94A3B8'}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: isActive ? '#1E293B' : '#64748B', fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {item.title}
                </Text>
                {isActive && <View style={[styles.activeDot, { backgroundColor: item.iconColor }]} />}
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        <View style={styles.divider} />

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerTagline}>Stay safe. Stay informed.</Text>
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
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1A2332',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  menuItemActive: {
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPngIcon: {
    width: 22,
    height: 22,
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
    color: '#94A3B8',
    textAlign: 'center',
  },
});
