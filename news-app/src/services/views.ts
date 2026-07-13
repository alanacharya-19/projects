const STORAGE_KEY = 'newsapp_view_counts';

function loadCounts(): Map<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Map(JSON.parse(raw));
  } catch {}
  return new Map();
}

function persistCounts(counts: Map<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...counts.entries()]));
  } catch {}
}

const viewCounts: Map<string, number> = loadCounts();
const listeners = new Set<() => void>();

export function incrementView(articleId: string): void {
  viewCounts.set(articleId, (viewCounts.get(articleId) || 0) + 1);
  persistCounts(viewCounts);
  listeners.forEach(fn => fn());
}

export function getViewCount(articleId: string): number {
  return viewCounts.get(articleId) || 0;
}

export function onViewChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTopViewed(ids: string[], count: number): string[] {
  return [...ids]
    .sort((a, b) => (viewCounts.get(b) || 0) - (viewCounts.get(a) || 0))
    .slice(0, count);
}
