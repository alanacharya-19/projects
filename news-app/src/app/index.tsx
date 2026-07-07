import { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import HomeHeader from '../components/HomeHeader';
import TrendingNews from '../components/TrendingNews';
import { ArticleSkeleton } from '../components/Skeleton';
import { ARTICLES, CATEGORIES } from '../data/articles';
import { useBookmarks } from '../context/BookmarkContext';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = selectedCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === selectedCategory);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={styles.container}>
      <HomeHeader unreadCount={3} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#c62828"
            colors={['#c62828']}
          />
        }
      >
        <TrendingNews />

        {loading ? (
          <View style={styles.list}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Latest News</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.list}>
              {filtered.map((item, i) => {
                const bookmarked = isBookmarked(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, i === filtered.length - 1 && { marginBottom: 0 }]}
                    onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
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
                      <TouchableOpacity
                        style={styles.bookmarkBtn}
                        onPress={() => toggleBookmark(item.id)}
                      >
                        <Ionicons
                          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={bookmarked ? '#c62828' : '#bbb'}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#c62828',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  chipTextActive: {
    color: 'white',
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
