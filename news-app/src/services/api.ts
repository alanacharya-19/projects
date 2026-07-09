import Constants from 'expo-constants';
import { ARTICLES, type Article } from '../data/articles';

const API_KEY = Constants.expoConfig?.extra?.newsApiKey as string | undefined;
const BASE_URL = 'https://content.guardianapis.com';

const CATEGORY_SECTIONS: Record<string, string> = {
  Technology: 'technology',
  Politics: 'politics',
  Sports: 'sport',
  Finance: 'business',
  Science: 'science',
  Health: 'health',
  Entertainment: 'culture',
  World: 'world',
};

function getSection(category?: string): string | undefined {
  if (!category || category === 'All') return undefined;
  return CATEGORY_SECTIONS[category];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
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

function idFromStr(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function mapGuardianArticle(item: any, category?: string): Article {
  const bodyHtml = item.fields?.body || '';
  const trailHtml = item.fields?.trailText || '';
  const body = stripHtml(bodyHtml || trailHtml) || `${item.webTitle} — Read more on The Guardian.`;
  const sectionName = item.sectionName || category || 'General';

  return {
    id: idFromStr(item.id || item.webUrl),
    title: item.webTitle,
    source: 'The Guardian',
    category: sectionName,
    time: relativeTime(item.webPublicationDate),
    reads: `${Math.floor(Math.random() * 8 + 1)}k`,
    image: item.fields?.thumbnail || undefined,
    body,
  };
}

function getMockArticles(category?: string): Article[] {
  if (!category || category === 'All') return ARTICLES;
  return ARTICLES.filter((a) => a.category === category);
}

async function fetchGuardian(path: string): Promise<any> {
  if (!API_KEY) throw new Error('No API key');
  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE_URL}${path}${separator}api-key=${API_KEY}`);
  if (!res.ok) throw new Error(`Guardian API error: ${res.status}`);
  const json = await res.json();
  if (json.response?.status !== 'ok') throw new Error('Guardian API error');
  return json.response;
}

export async function fetchTopHeadlines(category?: string): Promise<Article[]> {
  if (!API_KEY) return getMockArticles(category);

  const section = getSection(category);
  const params = new URLSearchParams({
    'show-fields': 'thumbnail,body,trailText',
    'page-size': '20',
    'order-by': 'newest',
  });
  if (section) params.set('section', section);

  try {
    const res = await fetchGuardian(`/search?${params}`);
    if (!res.results?.length) throw new Error('No articles');
    return res.results.map((a: any) => mapGuardianArticle(a, category));
  } catch (e) {
    console.warn('Failed to fetch news, using fallback data:', e);
    return getMockArticles(category);
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  if (!API_KEY || !query.trim()) return getMockArticles();

  const params = new URLSearchParams({
    q: query,
    'show-fields': 'thumbnail,body,trailText',
    'page-size': '20',
    'order-by': 'relevance',
  });

  try {
    const res = await fetchGuardian(`/search?${params}`);
    if (!res.results?.length) return [];
    return res.results.map((a: any) => mapGuardianArticle(a));
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
