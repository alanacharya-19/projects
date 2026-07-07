import { useRef, useEffect, useState } from 'react';
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
    gradient: ['#c62828', '#e53935'],
  },
  {
    id: '2',
    title: 'Tech Giant Announces Revolutionary AI Assistant',
    source: 'TechCrunch',
    category: 'Technology',
    gradient: ['#1565c0', '#1e88e5'],
  },
  {
    id: '3',
    title: 'Stock Markets Hit All-Time High Amid Economic Recovery',
    source: 'Reuters',
    category: 'Finance',
    gradient: ['#2e7d32', '#43a047'],
  },
  {
    id: '4',
    title: 'Breakthrough in Quantum Computing Announced',
    source: 'Nature',
    category: 'Science',
    gradient: ['#6a1b9a', '#8e24aa'],
  },
  {
    id: '5',
    title: 'Major Sports League Announces Expansion Teams',
    source: 'ESPN',
    category: 'Sports',
    gradient: ['#e65100', '#ef6c00'],
  },
  {
    id: '6',
    title: "New Study Reveals Benefits of Plant-Based Diet",
    source: 'Healthline',
    category: 'Health',
    gradient: ['#00695c', '#00897b'],
  },
];

export default function TrendingNews() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % TRENDING.length;
      indexRef.current = next;
      setActiveIndex(next);
      scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={14} color="#c62828" />
          </View>
          <Text style={styles.heading}>Trending</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color="#c62828" />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
      >
        {TRENDING.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={[styles.imageLayer, { backgroundColor: item.gradient[0] }]}>
              <View style={styles.imageOverlay} />
              <View style={styles.cardContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.sourceRow}>
                  <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.source}>{item.source}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {TRENDING.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flameCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '600',
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    paddingHorizontal: 16,
  },
  imageLayer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardContent: {
    padding: 20,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  source: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#c62828',
    borderRadius: 3,
  },
});
