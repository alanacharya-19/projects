import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.title, { color: colors.text }]}>Page Not Found</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {"The page you're looking for doesn't exist."}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  subtitle: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  button: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
