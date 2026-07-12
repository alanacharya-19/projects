import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PreferredContextType {
  preferredCategories: string[];
  setPreferredCategories: (cats: string[]) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const PreferredContext = createContext<PreferredContextType>({
  preferredCategories: [],
  setPreferredCategories: () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function PreferredProvider({ children }: { children: ReactNode }) {
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <PreferredContext.Provider value={{ preferredCategories, setPreferredCategories, refreshKey, triggerRefresh }}>
      {children}
    </PreferredContext.Provider>
  );
}

export function usePreferred() {
  return useContext(PreferredContext);
}
