import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface PreferredContextType {
  preferredCategories: string[];
  setPreferredCategories: (cats: string[]) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

const CAT_KEY = 'newsapp_preferred_cats';
const NAME_KEY = 'newsapp_user_name';

function loadCats(): string[] {
  try {
    const raw = localStorage.getItem(CAT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCats(cats: string[]) {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify(cats));
  } catch {}
}

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

const PreferredContext = createContext<PreferredContextType>({
  preferredCategories: [],
  setPreferredCategories: () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
  userName: '',
  setUserName: () => {},
});

export function PreferredProvider({ children }: { children: ReactNode }) {
  const [preferredCategories, setPreferredCategories] = useState<string[]>(loadCats);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState(loadName);

  useEffect(() => { saveCats(preferredCategories); }, [preferredCategories]);
  useEffect(() => { saveName(userName); }, [userName]);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <PreferredContext.Provider value={{ preferredCategories, setPreferredCategories, refreshKey, triggerRefresh, userName, setUserName }}>
      {children}
    </PreferredContext.Provider>
  );
}

export function usePreferred() {
  return useContext(PreferredContext);
}
