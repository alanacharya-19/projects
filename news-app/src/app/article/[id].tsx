import { Text, View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getArticleById, getRelatedArticles } from '../../data/articles';
import { useBookmarks } from '../../context/BookmarkContext';

export default function ArticleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  const article = getArticleById(id ?? '');
  if (!article) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
          <Text style={styles.errorTitle}>Article Not Found</Text>
        </View>
      </View>
    );
  }

  const bookmarked = isBookmarked(article.id);
  const related = getRelatedArticles(article, 3);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleBookmark(article.id)} style={styles.bookmarkBtn}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <Text style={styles.category}>{article.category}</Text>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Source</Text>
            <Text style={styles.metaValue}>{article.source}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Posted</Text>
            <Text style={styles.metaValue}>{article.time}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Reads</Text>
            <Text style={styles.metaValue}>{article.reads}</Text>
          </View>
        </View>

        {article.image ? (
          <Image source={{ uri: article.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ddd" />
            <Text style={styles.imageLabel}>Lead Image</Text>
          </View>
        )}

        <View style={styles.contentBlock}>
          {article.body.split('\n\n').map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>

        {related.length > 0 && (
          <>
            <Text style={styles.relatedTitle}>Related Articles</Text>
            {related.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.relatedCard}
                onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
              >
                <View style={styles.relatedMeta}>
                  <Text style={styles.relatedCategory}>{item.category}</Text>
                  <Text style={styles.relatedTime}>{item.time}</Text>
                </View>
                <Text style={styles.relatedText} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.relatedSource}>{item.source}</Text>
              </TouchableOpacity>
            ))}
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
  topBar: {
    backgroundColor: '#c62828',
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkBtn: {
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
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c62828',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 31,
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: 'white',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageLabel: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  contentBlock: {
    gap: 16,
    marginBottom: 28,
  },
  paragraph: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  relatedCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  relatedCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c62828',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  relatedTime: {
    fontSize: 11,
    color: '#ccc',
  },
  relatedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 20,
    marginBottom: 4,
  },
  relatedSource: {
    fontSize: 12,
    color: '#bbb',
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
    color: '#999',
  },
});
