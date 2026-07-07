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
      { icon: 'moon' as const, label: 'Dark Mode', sub: 'Off' },
    ],
  },
  {
    title: 'Library',
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

const TOP_READS = [
  { category: 'Technology', count: '18' },
  { category: 'Science', count: '12' },
  { category: 'Finance', count: '9' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarBg}>
                <Ionicons name="person" size={44} color="white" />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={12} color="white" />
              </TouchableOpacity>
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
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.readsSection}>
            <Text style={styles.readsTitle}>Top Categories</Text>
            <View style={styles.readsRow}>
              {TOP_READS.map((item) => (
                <View key={item.category} style={styles.readsCard}>
                  <Text style={styles.readsCount}>{item.count}</Text>
                  <Text style={styles.readsLabel}>{item.category}</Text>
                </View>
              ))}
            </View>
          </View>

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
            <View style={styles.signOutIcon}>
              <Ionicons name="log-out-outline" size={20} color="#c62828" />
            </View>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  topSection: {
    backgroundColor: '#c62828',
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  body: {
    padding: 20,
  },
  readsSection: {
    marginBottom: 28,
  },
  readsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  readsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  readsCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#c62828',
  },
  readsLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
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
    marginTop: 2,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
