import { useRef, useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { Article } from '../data/articles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH;

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#c62828',
  Technology: '#1565c0',
  Finance: '#2e7d32',
  Science: '#6a1b9a',
  Sports: '#e65100',
  Health: '#00695c',
  Entertainment: '#e91e63',
  World: '#00838f',
  General: '#37474f',
};

function getGradient(category: string): [string, string] {
  const base = CATEGORY_COLORS[category] || '#c62828';
  return [base, base + 'cc'];
}

interface TrendingNewsProps {
  articles: Article[];
}

export default function TrendingNews({ articles }: TrendingNewsProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const indexRef = useRef(0);
  const isTransitioning = useRef(false);

  const displayArticles = articles.length > 0
    ? [...articles, articles[0]]
    : [];

  useEffect(() => {
    if (articles.length === 0) return;
    const interval = setInterval(() => {
      if (isTransitioning.current) return;
      const next = indexRef.current + 1;

      if (next >= articles.length) {
        isTransitioning.current = true;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        setTimeout(() => {
          indexRef.current = 0;
          setActiveIndex(0);
          scrollRef.current?.scrollTo({ x: 0, animated: false });
          isTransitioning.current = false;
        }, 350);
      } else {
        indexRef.current = next;
        setActiveIndex(next);
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [articles.length]);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (idx >= articles.length) {
      setActiveIndex(0);
      indexRef.current = 0;
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    } else {
      setActiveIndex(idx);
      indexRef.current = idx;
    }
  };

  if (articles.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.flameCircle, { backgroundColor: colors.categoryBg }]}>
            <Ionicons name="flame" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>Trending</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
      >
        {displayArticles.map((item, i) => {
          const [color1, color2] = getGradient(item.category);
          return (
            <TouchableOpacity
              key={`${item.id}-${i}`}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
            >
              {item.image ? (
                <ImageBackground source={{ uri: item.image }} style={styles.imageLayer} resizeMode="cover">
                  <View style={[styles.imageOverlay, { backgroundColor: colors.overlay }]} />
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
                </ImageBackground>
              ) : (
                <View style={[styles.imageLayer, { backgroundColor: color1 }]}>
                  <View style={[styles.imageOverlay, { backgroundColor: colors.overlay }]} />
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
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {articles.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: colors.border }, i === activeIndex && { width: 20, backgroundColor: colors.primary }]} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
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
  },
});
