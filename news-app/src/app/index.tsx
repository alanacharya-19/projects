import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, RefreshControl, Linking, StyleSheet } from 'react-native';
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
import { usePreferred } from '../context/PreferredContext';

export default function Index() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewTick, setViewTick] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { notifications, addNotifications, unreadCount } = useNotifications();
  const { preferredCategories, refreshKey, userName } = usePreferred();

  const preferredParam = preferredCategories.length > 0 ? preferredCategories.join(',') : undefined;

  const loadArticles = useCallback(async (category?: string, pageNum: number = 1, append: boolean = false) => {
    const { articles: data, totalPages: total } = await fetchTopHeadlines(
      category,
      preferredParam && !category ? preferredParam : undefined,
      pageNum
    );
    if (append) {
      setArticles((prev) => [...prev, ...data]);
    } else {
      setArticles(data);
    }
    setTotalPages(total);
    setPage(pageNum);
    if ((!category || category === 'All') && pageNum === 1) {
      addNotifications(data);
    }
  }, [addNotifications, preferredParam]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await loadArticles(selectedCategory === 'All' ? undefined : selectedCategory, page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages, loadArticles, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setArticles([]);
    loadArticles();
  }, [loadArticles, refreshKey]);

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

  useEffect(() => {
    if (notifications.length > 0) {
      setBannerDismissed(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    let pollRef: ReturnType<typeof setInterval> | null = null;
    const initialDelay = setTimeout(() => {
      const startPolling = () => {
        pollRef = setInterval(async () => {
          try {
            const { articles: fresh } = await fetchTopHeadlines();
            addNotifications(fresh);
          } catch (e) {
            console.warn('Notification poll failed:', e);
          }
        }, 60000);
      };
      startPolling();
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden' && pollRef) {
            clearInterval(pollRef);
            pollRef = null;
          } else if (document.visibilityState === 'visible' && !pollRef) {
            startPolling();
          }
        });
      }
    }, 10000);
    return () => {
      clearTimeout(initialDelay);
      if (pollRef) clearInterval(pollRef);
    };
  }, [addNotifications]);

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
    setPage(1);
    await loadArticles(selectedCategory === 'All' ? undefined : selectedCategory, 1, false);
    setRefreshing(false);
  }, [loadArticles, selectedCategory]);

  const onCardPress = useCallback((item: Article) => {
    incrementView(item.id);
    setViewTick(t => t + 1);
    router.push({ pathname: '/article/[id]', params: { id: item.id } });
  }, []);

  const onCategoryChange = useCallback(async (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    setLoading(true);
    await loadArticles(cat === 'All' ? undefined : cat, 1, false);
    setLoading(false);
  }, [loadArticles]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <HomeHeader unreadCount={unreadCount} userName={userName} />
      {notifications.length > 0 && !bannerDismissed && (
        <TouchableOpacity
          style={[styles.breakingBanner, { backgroundColor: colors.primary }]}
          activeOpacity={0.9}
          onPress={() => {
            router.push({ pathname: '/article/[id]', params: { id: notifications[0].articleId } });
          }}
        >
          <View style={styles.breakingContent}>
            <View style={styles.breakingDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.breakingLabel}>BREAKING NEWS</Text>
              <Text style={styles.breakingTitle} numberOfLines={1}>{notifications[0].title}</Text>
            </View>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setBannerDismissed(true)}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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
                      onPress={() => onCardPress(item)}
                    >
                      {item.image && (
                        <View style={styles.cardImageWrap}>
                          <Image source={{ uri: item.image }} style={styles.cardImage} />
                          <View style={styles.cardCategoryBadge}>
                            <Text style={styles.cardCategoryText}>{item.category}</Text>
                          </View>
                          <View style={styles.cardActionRow}>
                            <TouchableOpacity
                              style={styles.cardActionBtn}
                              onPress={() => {
                                const url = item.shortUrl || undefined;
                                if (url) Linking.openURL(url);
                              }}
                            >
                              <Ionicons name="share-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cardActionBtn}
                              onPress={() => toggleBookmark(item.id, { title: item.title, source: item.source, category: item.category, time: item.time, image: item.image, reads: item.reads, byline: item.byline })}
                            >
                              <Ionicons
                                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                                size={18}
                                color={bookmarked ? colors.primary : '#fff'}
                              />
                            </TouchableOpacity>
                          </View>
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
                            <TouchableOpacity
                              onPress={() => {
                                const url = item.shortUrl || undefined;
                                if (url) Linking.openURL(url);
                              }}
                              style={{ marginRight: 8 }}
                            >
                              <Ionicons name="share-outline" size={14} color={colors.textMuted} />
                            </TouchableOpacity>
                            <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.metaText}>{item.reads}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              {page < totalPages && (
                <TouchableOpacity
                  style={[styles.loadMoreBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={loadMore}
                  disabled={loadingMore}
                >
                  <Ionicons name="chevron-down-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </Text>
                </TouchableOpacity>
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
  cardActionRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  cardActionBtn: {
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
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 24,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakingBanner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  breakingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffeb3b',
  },
  breakingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  breakingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 1,
  },
});
