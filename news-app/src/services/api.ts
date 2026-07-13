import Constants from 'expo-constants';
import { ARTICLES, getArticleById, type Article } from '../data/articles';

const API_KEY = Constants.expoConfig?.extra?.newsApiKey as string | undefined;
const BASE_URL = 'https://content.guardianapis.com';

const articleCache = new Map<string, Article>();

const CATEGORY_SECTIONS: Record<string, string> = {
  Technology: 'technology',
  Politics: 'politics',
  Sports: 'sport',
  Finance: 'business',
  Science: 'science',
  Health: 'health',
  Entertainment: 'culture',
  World: 'world',
  Movies: 'film',
};

function getSection(category?: string): string | undefined {
  if (!category || category === 'All') return undefined;
  return CATEGORY_SECTIONS[category];
}

function splitLongParagraph(text: string): string[] {
  if (text.length <= 400) return [text];
  const sentences = text.match(/[^.!?\n]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > 400 && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += ' ' + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 1 ? chunks : [text];
}

function extractParagraphs(html: string): string[] {
  const parts: string[] = [];
  const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      parts.push(...splitLongParagraph(text));
    }
  }
  return parts;
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

function extractImagesFromElements(elements: any[]): string[] {
  const urls: string[] = [];
  for (const el of elements || []) {
    if (el.type === 'image' && el.assets?.length) {
      const sorted = [...el.assets].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
      if (sorted[0]?.file) urls.push(sorted[0].file);
    }
  }
  return urls;
}

function mapGuardianArticle(item: any, category?: string): Article {
  const bodyHtml = item.fields?.body || '';
  const trailHtml = item.fields?.trailText || '';
  const paragraphs = bodyHtml ? extractParagraphs(bodyHtml) : [];
  const body = paragraphs.length > 0
    ? paragraphs.join('\n\n')
    : `${item.webTitle} — Read more on The Guardian.`;
  const sectionName = item.sectionName || category || 'General';

  const thumbnail = item.fields?.thumbnail || undefined;

  const article: Article = {
    id: idFromStr(item.id || item.webUrl),
    title: item.webTitle,
    source: 'The Guardian',
    category: sectionName,
    time: relativeTime(item.webPublicationDate),
    reads: `${Math.floor(Math.random() * 8 + 1)}k`,
    image: thumbnail,
    images: thumbnail ? [thumbnail] : [],
    body,
    sourceId: item.id || undefined,
    byline: item.fields?.byline || undefined,
    standfirst: item.fields?.standfirst
      ? item.fields.standfirst.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
      : undefined,
    wordcount: item.fields?.wordcount ? Number(item.fields.wordcount) : undefined,
    shortUrl: item.fields?.shortUrl || undefined,
  };

  articleCache.set(article.id, article);
  return article;
}

export async function fetchArticleDetail(article: Article): Promise<Article> {
  if (!API_KEY || !article.sourceId) return article;
  try {
    const res = await fetchGuardian(
      `/${article.sourceId}?show-blocks=all&show-fields=thumbnail,body,byline,standfirst,wordcount,shortUrl`
    );
    const content = res.content;
    if (!content) return article;

    const allImages: string[] = [];
    if (content.blocks?.main?.elements) {
      allImages.push(...extractImagesFromElements(content.blocks.main.elements));
    }
    if (content.blocks?.body) {
      for (const block of content.blocks.body) {
        if (block.elements) {
          allImages.push(...extractImagesFromElements(block.elements));
        }
      }
    }

    const updated = {
      ...article,
      images: allImages.length > 0 ? allImages : article.images,
      byline: content.fields?.byline || article.byline,
      standfirst: content.fields?.standfirst
        ? content.fields.standfirst.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
        : article.standfirst,
      wordcount: content.fields?.wordcount ? Number(content.fields.wordcount) : article.wordcount,
      shortUrl: content.fields?.shortUrl || article.shortUrl,
    };

    articleCache.set(article.id, updated);
    return updated;
  } catch {
    return article;
  }
}

export function getCachedArticle(id: string): Article | undefined {
  return articleCache.get(id) || getArticleById(id);
}

function getMockArticles(category?: string, sections?: string): Article[] {
  let source = (!category || category === 'All') ? [...ARTICLES] : ARTICLES.filter((a) => a.category === category);
  if (!category && sections) {
    const preferred = sections.split(',');
    source = source.filter((a) => preferred.includes(a.category));
  }
  const now = Date.now();
  source.sort((a, b) => {
    const hashA = (a.id.charCodeAt(0) || 0) * (now % 7919);
    const hashB = (b.id.charCodeAt(0) || 0) * (now % 7919);
    return hashB - hashA;
  });
  return source;
}

async function fetchGuardian(path: string): Promise<any> {
  if (!API_KEY) throw new Error('No API key');
  const separator = path.includes('?') ? '&' : '?';
  const cacheBuster = `_cb=${Date.now()}`;
  const res = await fetch(`${BASE_URL}${path}${separator}api-key=${API_KEY}&${cacheBuster}`, {
    cache: 'no-cache',
  });
  if (!res.ok) throw new Error(`Guardian API error: ${res.status}`);
  const json = await res.json();
  if (json.response?.status !== 'ok') throw new Error('Guardian API error');
  return json.response;
}

export async function fetchTopHeadlines(category?: string, sections?: string, page: number = 1): Promise<{ articles: Article[]; totalPages: number }> {
  if (!API_KEY) return { articles: getMockArticles(category, sections), totalPages: 1 };

  let section = getSection(category);
  if (!section && sections) {
    section = sections.split(',').map((s) => CATEGORY_SECTIONS[s.trim()] || s.trim().toLowerCase()).filter(Boolean).join('|');
  }
  const params = new URLSearchParams({
    'show-fields': 'thumbnail,body,trailText,byline,standfirst,wordcount,shortUrl',
    'page-size': '20',
    'page': String(page),
    'order-by': 'newest',
  });
  if (section) params.set('section', section);

  try {
    const res = await fetchGuardian(`/search?${params}`);
    if (!res.results?.length) throw new Error('No articles');
    return { articles: res.results.map((a: any) => mapGuardianArticle(a, category)), totalPages: res.pages || 1 };
  } catch (e) {
    console.warn('Failed to fetch news, using fallback data:', e);
    return { articles: getMockArticles(category, sections), totalPages: 1 };
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  if (!API_KEY || !query.trim()) return getMockArticles();

  const params = new URLSearchParams({
    q: query,
    'show-fields': 'thumbnail,body,trailText,byline,standfirst,wordcount,shortUrl',
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
