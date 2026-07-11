const viewCounts = new Map<string, number>();
const listeners = new Set<() => void>();

export function incrementView(articleId: string): void {
  viewCounts.set(articleId, (viewCounts.get(articleId) || 0) + 1);
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
