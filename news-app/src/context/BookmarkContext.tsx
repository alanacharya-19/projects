import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ArticleSummary {
  title: string;
  source: string;
  category: string;
  time: string;
  image?: string;
  byline?: string;
  reads?: string;
}

interface BookmarkContextType {
  bookmarks: Set<string>;
  bookmarkData: Record<string, ArticleSummary>;
  toggleBookmark: (id: string, article?: ArticleSummary) => void;
  isBookmarked: (id: string) => boolean;
}

const STORAGE_KEY = 'newsapp_bookmarks';

interface StoredData {
  ids: string[];
  data: Record<string, ArticleSummary>;
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ids: [], data: {} };
}

function saveData(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredData>(loadData);

  useEffect(() => {
    saveData(stored);
  }, [stored]);

  const bookmarks = new Set(stored.ids);
  const bookmarkData = stored.data;

  const toggleBookmark = useCallback((id: string, article?: ArticleSummary) => {
    setStored((prev) => {
      const ids = prev.ids.includes(id)
        ? prev.ids.filter((i) => i !== id)
        : [id, ...prev.ids];
      const data = { ...prev.data };
      if (ids.includes(id) && article) {
        data[id] = article;
      } else if (!ids.includes(id)) {
        delete data[id];
      }
      return { ids, data };
    });
  }, []);

  const isBookmarked = useCallback(
    (id: string) => stored.ids.includes(id),
    [stored.ids]
  );

  return (
    <BookmarkContext.Provider value={{ bookmarks, bookmarkData, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
