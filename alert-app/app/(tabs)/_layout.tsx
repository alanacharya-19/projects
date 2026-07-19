import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAlertContext } from '@/context/AlertContext';

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: 'home', outline: 'home-outline' },
  forecast: { focused: 'cloud', outline: 'cloud-outline' },
  map: { focused: 'map', outline: 'map-outline' },
  alerts: { focused: 'notifications', outline: 'notifications-outline' },
  more: { focused: 'ellipsis-horizontal', outline: 'ellipsis-horizontal-outline' },
};

const ICON_SIZE = 22;

export default function TabLayout() {
  const { colors, resolvedMode } = useTheme();
  const { unreadCount } = useAlertContext();
  const isDark = resolvedMode === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.82)' : 'rgba(255, 255, 255, 0.82)',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 8,
          marginLeft: 20,
          marginRight: 20,
          marginBottom: Platform.OS === 'ios' ? 12 : 8,
          borderRadius: 28,
          shadowColor: '#0A1628',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      {Object.entries(TAB_ICONS).map(([name, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: name === 'index' ? 'Home' : name.charAt(0).toUpperCase() + name.slice(1),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: focused
                    ? isDark
                      ? 'rgba(129, 140, 248, 0.18)'
                      : 'rgba(99, 102, 241, 0.12)'
                    : 'transparent',
                }}
              >
                <Ionicons
                  name={focused ? icon.focused : icon.outline}
                  size={ICON_SIZE}
                  color={color}
                />
              </View>
            ),
            tabBarBadge: name === 'alerts' && unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: colors.error,
              fontSize: 10,
              fontWeight: '700',
              minWidth: 18,
              height: 18,
              lineHeight: 18,
              top: 2,
              right: 8,
              paddingHorizontal: 5,
              borderRadius: 9,
            },
          }}
        />
      ))}
    </Tabs>
  );
}
