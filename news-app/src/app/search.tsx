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

const TOPICS = ['Technology', 'Politics', 'Sports', 'Finance', 'Science', 'Health', 'World', 'Business'];

const RECENT = [
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
                  <TouchableOpacity key={topic} style={styles.chip} onPress={() => setQuery(topic)}>
                    <Text style={styles.chipText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {RECENT.length > 0 && (
                  <TouchableOpacity>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              {RECENT.map((item) => (
                <TouchableOpacity key={item.term} style={styles.recentRow} onPress={() => setQuery(item.term)}>
                  <View style={styles.recentIcon}>
                    <Ionicons name="time-outline" size={16} color="#999" />
                  </View>
                  <Text style={styles.recentTerm}>{item.term}</Text>
                  <Text style={styles.recentTime}>{item.time}</Text>
                  <Ionicons name="close" size={16} color="#ddd" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : suggestions.length > 0 && results.length === 0 ? (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionHint}>Suggestions</Text>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionRow} onPress={() => setQuery(s)}>
                <Ionicons name="search-outline" size={18} color="#999" />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={36} color="#ccc" />
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
              <TouchableOpacity key={item.id} style={styles.card}>
                <View style={styles.thumb}>
                  <Ionicons name="newspaper-outline" size={24} color="#ddd" />
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
    backgroundColor: '#f5f6f8',
  },
  topBar: {
    backgroundColor: '#c62828',
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
    color: '#1a1a2e',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'white',
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
    color: '#333',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTerm: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recentTime: {
    fontSize: 12,
    color: '#ccc',
  },
  suggestionsWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  suggestionHint: {
    fontSize: 12,
    color: '#bbb',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptySub: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 4,
  },
  resultsWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    marginBottom: 14,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
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
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c62828',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 11,
    color: '#ccc',
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
    color: '#bbb',
    fontWeight: '500',
  },
});
