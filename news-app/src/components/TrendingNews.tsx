import { useRef, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH;

const TRENDING = [
  {
    id: '1',
    title: 'Global Summit on Climate Change Reaches Historic Agreement',
    source: 'BBC News',
    category: 'Politics',
  },
  {
    id: '2',
    title: 'Tech Giant Announces Revolutionary AI Assistant',
    source: 'TechCrunch',
    category: 'Technology',
  },
  {
    id: '3',
    title: 'Stock Markets Hit All-Time High Amid Economic Recovery',
    source: 'Reuters',
    category: 'Finance',
  },
  {
    id: '4',
    title: 'Breakthrough in Quantum Computing Announced',
    source: 'Nature',
    category: 'Science',
  },
  {
    id: '5',
    title: 'Major Sports League Announces Expansion Teams',
    source: 'ESPN',
    category: 'Sports',
  },
  {
    id: '6',
    title: "New Study Reveals Benefits of Plant-Based Diet",
    source: 'Healthline',
    category: 'Health',
  },
];

export default function TrendingNews() {
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % TRENDING.length;
      const offset = indexRef.current * CARD_WIDTH;
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="flame" size={18} color="#c62828" />
          <Text style={styles.heading}>Trending</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      >
        {TRENDING.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="newspaper-outline" size={28} color="#ccc" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.source}>{item.source}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  seeAll: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '600',
  },
  scrollContent: {
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 10,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c62828',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 18,
    marginBottom: 6,
  },
  source: {
    fontSize: 11,
    color: '#999',
  },
});
