import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_SECTIONS = [
  {
    title: 'Preferences',
    items: [
      { icon: 'newspaper' as const, label: 'News Categories', sub: 'Technology, Politics, Sports' },
      { icon: 'notifications' as const, label: 'Notifications', sub: 'Push, Email, Digest' },
      { icon: 'language' as const, label: 'Language', sub: 'English' },
      { icon: 'moon' as const, label: 'Dark Mode', sub: 'Off', right: 'chevron' as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'bookmark' as const, label: 'Saved Articles', sub: '12 articles' },
      { icon: 'time' as const, label: 'Reading History', sub: 'Continue where you left off' },
      { icon: 'download' as const, label: 'Offline Reading', sub: '3 articles saved' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle' as const, label: 'Help & FAQ' },
      { icon: 'chatbubble-ellipses' as const, label: 'Send Feedback' },
      { icon: 'star' as const, label: 'Rate the App' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <Text style={styles.name}>Alan</Text>
          <Text style={styles.email}>alan@example.com</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>48</Text>
              <Text style={styles.statLabel}>Read</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>7</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuBorder]}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={20} color="#c62828" />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {'sub' in item && <Text style={styles.menuSub}>{item.sub}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOut}>
          <Ionicons name="log-out-outline" size={20} color="#c62828" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
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
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  profileSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  menuSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c62828',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ccc',
  },
});
