import Constants from 'expo-constants';
import { ARTICLES, type Article } from '../data/articles';

const API_KEY = Constants.expoConfig?.extra?.newsApiKey as string | undefined;
const BASE_URL = 'https://gnews.io/api/v4';

const CATEGORY_MAP: Record<string, string> = {
  Technology: 'tech',
  Politics: 'nation',
  Sports: 'sports',
  Finance: 'business',
  Science: 'science',
  Health: 'health',
  Entertainment: 'entertainment',
  World: 'world',
};

function getTopic(category?: string): string | undefined {
  if (!category || category === 'All') return undefined;
  return CATEGORY_MAP[category];
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function idFromUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function mapArticle(a: any, category?: string): Article {
  return {
    id: idFromUrl(a.url),
    title: a.title,
    source: a.source?.name || 'Unknown',
    category: category || 'General',
    time: relativeTime(a.publishedAt),
    reads: `${Math.floor(Math.random() * 8 + 1)}k`,
    image: a.image || undefined,
    body: a.content || a.description || '',
  };
}

function getMockArticles(category?: string): Article[] {
  if (!category || category === 'All') return ARTICLES;
  return ARTICLES.filter((a) => a.category === category);
}

export async function fetchTopHeadlines(category?: string): Promise<Article[]> {
  if (!API_KEY) return getMockArticles(category);

  const topic = getTopic(category);
  const params = new URLSearchParams({
    token: API_KEY,
    lang: 'en',
    country: 'us',
    max: '20',
  });
  if (topic) params.set('topic', topic);

  const url = `${BASE_URL}/top-headlines?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json.articles?.length) throw new Error('No articles');
    return json.articles.map((a: any) => mapArticle(a, category));
  } catch (e) {
    console.warn('Failed to fetch news, using fallback data:', e);
    return getMockArticles(category);
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  if (!API_KEY || !query.trim()) return getMockArticles();

  const params = new URLSearchParams({
    token: API_KEY,
    q: query,
    lang: 'en',
    max: '20',
  });

  try {
    const res = await fetch(`${BASE_URL}/search?${params}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json.articles?.length) return [];
    return json.articles.map((a: any) => mapArticle(a, 'General'));
  } catch (e) {
    console.warn('Search failed, using fallback:', e);
    return getMockArticles().filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.source.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
    );
  }
}
