import { useState } from 'react';
import { Text, View, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_RESULTS = [
  { id: '1', title: 'Global Summit on Climate Change Reaches Historic Agreement', source: 'BBC News', category: 'Politics', time: '2h ago' },
  { id: '2', title: 'Tech Giant Announces Revolutionary AI Assistant', source: 'TechCrunch', category: 'Technology', time: '4h ago' },
  { id: '3', title: 'Stock Markets Hit All-Time High Amid Economic Recovery', source: 'Reuters', category: 'Finance', time: '1h ago' },
  { id: '4', title: 'Breakthrough in Quantum Computing Announced', source: 'Nature', category: 'Science', time: '6h ago' },
  { id: '5', title: 'Major Sports League Announces Expansion Teams', source: 'ESPN', category: 'Sports', time: '3h ago' },
  { id: '6', title: 'New Study Reveals Benefits of Plant-Based Diet', source: 'Healthline', category: 'Health', time: '5h ago' },
];

const TRENDING_TOPICS = ['Technology', 'Politics', 'Sports', 'Finance', 'Science', 'Health', 'World', 'Business'];

const RECENT_SEARCHES = [
  { term: 'climate change', time: '2 days ago' },
  { term: 'AI technology', time: '5 days ago' },
  { term: 'stock market', time: '1 week ago' },
];

const SUGGESTIONS: Record<string, string[]> = {
  t: ['Technology stocks', 'Tech startups 2026', 'Tesla news'],
  te: ['Technology trends', 'Tech earnings report'],
  tec: ['Technology'],
  p: ['Politics today', 'President news', 'Policy changes'],
  s: ['Sports scores', 'Science breakthroughs', 'Stock market'],
  sp: ['Sports', 'Space exploration'],
};

function getSuggestions(query: string): string[] {
  const lower = query.toLowerCase();
  for (const [prefix, sug] of Object.entries(SUGGESTIONS)) {
    if (lower.startsWith(prefix)) return sug;
  }
  return [];
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? MOCK_RESULTS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.source.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const suggestions = query.trim() ? getSuggestions(query.trim()) : [];

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={18} color="#ccc" />
            <TextInput
              style={styles.input}
              placeholder="Search news..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={setQuery}
              autoFocus
              cursorColor="white"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
      >
        {query.trim() === '' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Topics</Text>
              <View style={styles.chipsRow}>
                {TRENDING_TOPICS.map((topic) => (
                  <TouchableOpacity key={topic} style={styles.chip} onPress={() => setQuery(topic)}>
                    <Ionicons name="trending-up" size={14} color="#c62828" />
                    <Text style={styles.chipText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {RECENT_SEARCHES.map((item) => (
                <TouchableOpacity key={item.term} style={styles.recentRow} onPress={() => setQuery(item.term)}>
                  <Ionicons name="time-outline" size={18} color="#999" />
                  <Text style={styles.recentTerm}>{item.term}</Text>
                  <Text style={styles.recentTime}>{item.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : suggestions.length > 0 && results.length === 0 ? (
          <View style={styles.suggestionsWrap}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionRow} onPress={() => setQuery(s)}>
                <Ionicons name="search-outline" size={18} color="#999" />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={40} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptySub}>
              {`No articles match "${query}". Try a different keyword or browse topics.`}
            </Text>
          </View>
        ) : (
          <View style={styles.resultsWrap}>
            <Text style={styles.resultCount}>{results.length} result{results.length > 1 ? 's' : ''}</Text>
            {results.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.thumb}>
                    <Ionicons name="newspaper-outline" size={24} color="#ddd" />
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.meta}>
                    <Text style={styles.category}>{item.category}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  topBar: {
    backgroundColor: '#c62828',
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  recentTerm: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  recentTime: {
    fontSize: 12,
    color: '#999',
  },
  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  suggestionText: {
    fontSize: 14,
    color: '#555',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  cardLeft: {
    justifyContent: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c62828',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 11,
    color: '#bbb',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 19,
    marginBottom: 4,
  },
  source: {
    fontSize: 12,
    color: '#999',
  },
});
