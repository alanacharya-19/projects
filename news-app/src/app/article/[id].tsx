import { useEffect, useRef, useState, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Animated, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRelatedArticles } from '../../data/articles';
import { getCachedArticle, fetchArticleDetail } from '../../services/api';
import { useBookmarks } from '../../context/BookmarkContext';
import { useTheme } from '../../context/ThemeContext';
import type { Article } from '../../data/articles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_PARAGRAPHS = 2;
const SCROLL_TOP_THRESHOLD = 300;

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ArticleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const galleryRef = useRef<ScrollView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [article, setArticle] = useState<Article | undefined>(undefined);
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;
  const imageIndexRef = useRef(0);

  const cached = getCachedArticle(id ?? '');
  useEffect(() => {
    if (cached) {
      setArticle(cached);
      if (cached.sourceId) {
        fetchArticleDetail(cached).then(setArticle);
      }
    }
  }, [cached?.id]);

  useEffect(() => {
    const images = article?.images || [];
    if (images.length < 2) return;
    const interval = setInterval(() => {
      const next = (imageIndexRef.current + 1) % images.length;
      imageIndexRef.current = next;
      setActiveImage(next);
      galleryRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [article?.images?.length]);

  const paragraphs = useMemo(() => (article?.body ?? '').split('\n\n').filter(Boolean), [article?.body]);
  const readTime = useMemo(() => estimateReadTime(article?.body ?? ''), [article?.body]);
  const bookmarked = isBookmarked(article?.id ?? '');
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!article) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Article Not Found</Text>
        </View>
      </View>
    );
  }

  const related = getRelatedArticles(article, 3);
  const images = article.images || [];
  const preview = paragraphs.slice(0, PREVIEW_PARAGRAPHS);
  const rest = paragraphs.slice(PREVIEW_PARAGRAPHS);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => toggleBookmark(article.id)} style={styles.iconBtn}>
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color="white" />
            </TouchableOpacity>
            {article.sourceId && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => Linking.openURL(`https://www.theguardian.com/${article.sourceId}`)}
              >
                <Ionicons name="share-outline" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const visible = y > SCROLL_TOP_THRESHOLD;
          if (visible !== showScrollTop) {
            setShowScrollTop(visible);
            Animated.timing(scrollTopOpacity, {
              toValue: visible ? 1 : 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.categoryRow}>
          <View style={[styles.categoryPill, { backgroundColor: colors.categoryBg }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{article.category}</Text>
          </View>
          <View style={[styles.readTimePill, { backgroundColor: colors.iconBg }]}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.readTimeText}>{readTime} min read</Text>
          </View>
        </View>

        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.sourceRow}>
          <View style={styles.sourceAvatar}>
            <Text style={styles.sourceAvatarText}>G</Text>
          </View>
          <View>
            <Text style={styles.sourceName}>{article.source}</Text>
            <Text style={styles.sourceTime}>{article.time}</Text>
          </View>
        </View>

        {images.length > 0 ? (
          <View style={styles.galleryWrap}>
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImage(idx);
                imageIndexRef.current = idx;
              }}
            >
              {images.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.galleryDots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.galleryDot, { backgroundColor: colors.border }, i === activeImage && { width: 20, backgroundColor: colors.primary }]} />
                ))}
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.contentBlock}>
          {preview.map((p, i) => (
            <Text key={i} style={i === 0 ? styles.leadParagraph : styles.paragraph}>{p}</Text>
          ))}
          {!expanded && rest.length > 0 && (
            <TouchableOpacity style={[styles.expandBtn, { backgroundColor: colors.primary }]} onPress={() => setExpanded(true)}>
              <Text style={styles.expandBtnText}>Read full article</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
          )}
          {expanded && rest.map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}
          {article.sourceId && (
            <TouchableOpacity
              style={[styles.sourceLink, { borderColor: colors.border }]}
              onPress={() => Linking.openURL(`https://www.theguardian.com/${article.sourceId}`)}
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={[styles.sourceLinkText, { color: colors.primary }]}>Read on The Guardian</Text>
            </TouchableOpacity>
          )}
        </View>

        {related.length > 0 && (
          <>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={styles.dividerText}>Related</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            {related.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.relatedCard, { backgroundColor: colors.card }]}
                onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
              >
                <View style={styles.relatedTop}>
                  <View style={[styles.relatedCategoryPill, { backgroundColor: colors.categoryBg }]}>
                    <Text style={[styles.relatedCategoryText, { color: colors.primary }]}>{item.category}</Text>
                  </View>
                  <Text style={styles.relatedTime}>{item.time}</Text>
                </View>
                <Text style={styles.relatedTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.relatedSource}>{item.source}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.footer} />
      </ScrollView>

      <Animated.View
        pointerEvents={showScrollTop ? 'auto' : 'none'}
        style={[
          styles.scrollTopBtn,
          { opacity: scrollTopOpacity, transform: [{ scale: scrollTopOpacity }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={[styles.scrollTopInner, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="chevron-up" size={22} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  readTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  readTimeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 29,
    letterSpacing: 0.15,
    marginBottom: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sourceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sourceTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  galleryWrap: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  galleryImage: {
    width: SCREEN_WIDTH - 40,
    height: 220,
    backgroundColor: colors.border,
  },
  galleryDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  contentBlock: {
    gap: 18,
    marginBottom: 24,
  },
  leadParagraph: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 25,
    letterSpacing: 0.2,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  expandBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  sourceLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relatedCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  relatedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  relatedCategoryPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  relatedCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  relatedTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  relatedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  relatedSource: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
  },
  footer: {
    height: 20,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollTopInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
