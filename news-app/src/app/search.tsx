import { useState, useEffect, useRef, useMemo } from 'react';
import { Text, View, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchArticles } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import type { Article } from '../data/articles';

const TOPICS = ['Technology', 'Politics', 'Sports', 'Finance', 'Science', 'Health', 'World', 'Business'];

const RECENT = [
  { term: 'climate change', time: '2 days ago' },
  { term: 'AI technology', time: '5 days ago' },
  { term: 'stock market', time: '1 week ago' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    clearTimeout(timer.current);
    setSearching(true);

    timer.current = setTimeout(async () => {
      const data = await searchArticles(query);
      setResults(data);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.input}
              placeholder="Search news..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={query}
              onChangeText={setQuery}
              autoFocus
              cursorColor="white"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        {query.trim() === '' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Explore Topics</Text>
              <View style={styles.chipsRow}>
                {TOPICS.map((topic) => (
                  <TouchableOpacity key={topic} style={[styles.chip, { backgroundColor: colors.card }]} onPress={() => setQuery(topic)}>
                    <Text style={[styles.chipText, { color: colors.text }]}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {RECENT.length > 0 && (
                  <TouchableOpacity>
                    <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              {RECENT.map((item) => (
                <TouchableOpacity key={item.term} style={[styles.recentRow, { borderBottomColor: colors.border }]} onPress={() => setQuery(item.term)}>
                  <View style={[styles.recentIcon, { backgroundColor: colors.iconBg }]}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  </View>
                  <Text style={styles.recentTerm}>{item.term}</Text>
                  <Text style={styles.recentTime}>{item.time}</Text>
                  <Ionicons name="close" size={16} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : searching ? (
          <View style={styles.searchingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.iconBg }]}>
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptySub}>
              {`No articles match "${query}"`}
            </Text>
            <Text style={styles.emptyHint}>Try a different keyword or browse topics</Text>
          </View>
        ) : (
          <View style={styles.resultsWrap}>
            <Text style={styles.resultCount}>{results.length} result{results.length > 1 ? 's' : ''}</Text>
            {results.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumbImage} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.iconBg }]}>
                    <Ionicons name="newspaper-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.cardRight}>
                  <View style={styles.meta}>
                    <Text style={[styles.category, { color: colors.primary }]}>{item.category}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.source}>{item.source}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  topBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: 'white',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  body: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTerm: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  recentTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  searchingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
  },
  searchingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  resultsWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  resultCount: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 14,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  cardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  source: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
