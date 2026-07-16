import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function AlertsScreen() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 18, color: colors.textMuted, fontWeight: '600' }}>
        Alerts
      </Text>
    </View>
  );
}
