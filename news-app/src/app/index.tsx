import { useState, useEffect, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import HomeHeader from '../components/HomeHeader';
import TrendingNews from '../components/TrendingNews';
import { ArticleSkeleton, TrendingSkeleton, SkeletonBlock } from '../components/Skeleton';
import { fetchTopHeadlines } from '../services/api';
import { incrementView, getViewCount, onViewChange } from '../services/views';
import { CATEGORIES, type Article } from '../data/articles';
import { useBookmarks } from '../context/BookmarkContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function Index() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewTick, setViewTick] = useState(0);
  const { toggleBookmark, isBookmarked } = useBookmarks();

  const { addNotifications, unreadCount } = useNotifications();

  const loadArticles = useCallback(async (category?: string) => {
    const data = await fetchTopHeadlines(category);
    setArticles(data);
    if (!category || category === 'All') {
      addNotifications(data);
    }
  }, [addNotifications]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (!loading && articles.length > 0) return;
    if (articles.length > 0) setLoading(false);
    else {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [articles, loading]);

  useEffect(() => {
    return onViewChange(() => setViewTick(t => t + 1));
  }, []);

  const trendingArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const viewsA = getViewCount(a.id);
      const viewsB = getViewCount(b.id);
      if (viewsA !== viewsB) return viewsB - viewsA;
      const readsA = parseInt(a.reads.replace('k', '000'));
      const readsB = parseInt(b.reads.replace('k', '000'));
      return readsB - readsA;
    }).slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, viewTick]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(selectedCategory === 'All' ? undefined : selectedCategory);
    setRefreshing(false);
  }, [loadArticles, selectedCategory]);

  const onCardPress = useCallback((id: string) => {
    incrementView(id);
    setViewTick(t => t + 1);
    router.push({ pathname: '/article/[id]', params: { id } });
  }, []);

  const onCategoryChange = useCallback(async (cat: string) => {
    setSelectedCategory(cat);
    setLoading(true);
    await loadArticles(cat === 'All' ? undefined : cat);
    setLoading(false);
  }, [loadArticles]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <HomeHeader unreadCount={unreadCount} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading && articles.length === 0 ? (
          <>
            <TrendingSkeleton />
            <View style={styles.chipsContainer}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: colors.card }]}>
                  <SkeletonBlock width={50} height={14} borderRadius={7} />
                </View>
              ))}
            </View>
            <View style={styles.list}>
              {Array.from({ length: 4 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </View>
          </>
        ) : (
          <>
            <TrendingNews articles={trendingArticles} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && { backgroundColor: colors.primary }]}
                  onPress={() => onCategoryChange(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && { color: 'white' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.list}>
              {articles.length === 0 ? (
                <Text style={styles.emptyText}>No articles found. Pull down to refresh.</Text>
              ) : (
                articles.map((item, i) => {
                  const bookmarked = isBookmarked(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, i === articles.length - 1 && { marginBottom: 0 }]}
                      activeOpacity={0.92}
                      onPress={() => onCardPress(item.id)}
                    >
                      {item.image && (
                        <View style={styles.cardImageWrap}>
                          <Image source={{ uri: item.image }} style={styles.cardImage} />
                          <View style={styles.cardCategoryBadge}>
                            <Text style={styles.cardCategoryText}>{item.category}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.bookmarkOverlay}
                            onPress={() => toggleBookmark(item.id)}
                          >
                            <Ionicons
                              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={20}
                              color={bookmarked ? colors.primary : '#fff'}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                      <View style={styles.cardBody}>
                        {!item.image && (
                          <View style={styles.cardCatRow}>
                            <View style={styles.cardCategoryBadgeInline}>
                              <Text style={styles.cardCategoryText}>{item.category}</Text>
                            </View>
                          </View>
                        )}
                        <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
                        {item.byline && (
                          <View style={styles.bylineRow}>
                            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.bylineText} numberOfLines={1}>{item.byline}</Text>
                          </View>
                        )}
                        <View style={styles.cardMeta}>
                          <View style={styles.metaLeft}>
                            <Text style={styles.metaText}>{item.source}</Text>
                            <View style={styles.metaDot} />
                            <Text style={styles.metaText}>{item.time}</Text>
                          </View>
                          <View style={styles.metaRight}>
                            <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.metaText}>{item.reads}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 4,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  cardCategoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  cardCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookmarkOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardCatRow: {
    flexDirection: 'row',
  },
  cardCategoryBadgeInline: {
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bylineText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 40,
  },
});
