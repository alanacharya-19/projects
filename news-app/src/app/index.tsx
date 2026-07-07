import { Text, View, ScrollView, StyleSheet } from 'react-native';
import HomeHeader from '../components/HomeHeader';
import TrendingNews from '../components/TrendingNews';

export default function Index() {
  return (
    <View style={styles.container}>
      <HomeHeader unreadCount={3} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <TrendingNews />

        <View style={styles.latestSection}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>Breaking Story {i + 1}</Text>
              <Text style={styles.cardBody}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  latestSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
