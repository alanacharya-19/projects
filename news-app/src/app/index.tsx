import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeHeader from '../components/HomeHeader';
import TrendingNews from '../components/TrendingNews';

const ARTICLES = [
  { id: '1', title: 'Global Markets Rally as Tech Sector Posts Record Earnings', source: 'Reuters', category: 'Finance', time: '2h ago', reads: '1.2k' },
  { id: '2', title: 'Revolutionary Battery Technology Could Double EV Range', source: 'TechCrunch', category: 'Technology', time: '4h ago', reads: '3.4k' },
  { id: '3', title: 'Health Officials Announce Breakthrough in Cancer Research', source: 'BBC News', category: 'Health', time: '5h ago', reads: '2.8k' },
  { id: '4', title: 'New Climate Policy Framework Gains International Support', source: 'The Guardian', category: 'Politics', time: '7h ago', reads: '956' },
  { id: '5', title: 'Professional Soccer League Announces Expansion to 32 Teams', source: 'ESPN', category: 'Sports', time: '8h ago', reads: '4.1k' },
  { id: '6', title: 'Quantum Computing Milestone Achieved by Research Team', source: 'Nature', category: 'Science', time: '10h ago', reads: '2.2k' },
  { id: '7', title: 'Housing Market Shows Signs of Recovery After Rate Cuts', source: 'Bloomberg', category: 'Finance', time: '12h ago', reads: '1.8k' },
  { id: '8', title: 'Streaming Platform Announces Major Original Content Slate', source: 'Variety', category: 'Entertainment', time: '14h ago', reads: '5.6k' },
  { id: '9', title: 'NASA Reveals Plans for Permanent Lunar Base by 2035', source: 'Space News', category: 'Science', time: '16h ago', reads: '7.2k' },
  { id: '10', title: 'New AI Tool Could Revolutionize Medical Diagnostics', source: 'Wired', category: 'Technology', time: '18h ago', reads: '3.9k' },
  { id: '11', title: 'Global Trade Agreement Reached After Months of Negotiations', source: 'Reuters', category: 'Politics', time: '20h ago', reads: '1.5k' },
  { id: '12', title: 'Electric Vehicle Sales Surge Past 50% Market Share', source: 'Bloomberg', category: 'Finance', time: '22h ago', reads: '2.6k' },
];

export default function Index() {
  return (
    <View style={styles.container}>
      <HomeHeader unreadCount={3} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <TrendingNews />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Latest News</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.list}>
          {ARTICLES.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, i === ARTICLES.length - 1 && { marginBottom: 0 }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.metaRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.sourceText}>{item.source}</Text>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.statRow}>
                  <Ionicons name="eye-outline" size={13} color="#bbb" />
                  <Text style={styles.statText}>{item.reads}</Text>
                </View>
                <TouchableOpacity style={styles.bookmarkBtn}>
                  <Ionicons name="bookmark-outline" size={18} color="#bbb" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryPill: {
    backgroundColor: '#fef0f0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c62828',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 11,
    color: '#bbb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#bbb',
  },
  bookmarkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
