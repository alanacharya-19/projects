import { createContext, useContext, useState, useCallback } from 'react';
import type { Article } from '../data/articles';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  articleId: string;
  icon: 'globe' | 'trending-up' | 'flask' | 'football' | 'rainy' | 'bar-chart' | 'megaphone' | 'medkit';
}

const CATEGORY_ICONS: Record<string, NotificationItem['icon']> = {
  Finance: 'bar-chart',
  Technology: 'trending-up',
  Health: 'medkit',
  Politics: 'megaphone',
  Sports: 'football',
  Science: 'flask',
  Entertainment: 'globe',
  World: 'globe',
  General: 'globe',
};

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotifications: (articles: Article[]) => void;
  markAllRead: () => void;
  toggleRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

let notifCounter = 0;
const seenIds = new Set<string>();

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotifications = useCallback((articles: Article[]) => {
    const newItems: NotificationItem[] = [];
    for (const article of articles) {
      if (seenIds.has(article.id)) continue;
      seenIds.add(article.id);
      notifCounter++;
      newItems.push({
        id: `n-${notifCounter}`,
        title: article.title,
        body: `New ${article.category.toLowerCase()} article from ${article.source}`,
        time: article.time,
        read: false,
        articleId: article.id,
        icon: CATEGORY_ICONS[article.category] || 'globe',
      });
    }
    if (newItems.length > 0) {
      setNotifications((prev) => [...newItems, ...prev]);
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const toggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotifications, markAllRead, toggleRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
