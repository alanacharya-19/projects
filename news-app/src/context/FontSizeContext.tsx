import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'newsapp_font_scale';

interface FontSizeContextType {
  fontScale: number;
  setFontScale: (s: number) => void;
}

const FontSizeContext = createContext<FontSizeContextType | null>(null);

function loadScale(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const v = parseFloat(raw);
      if (v >= 0.8 && v <= 1.4) return v;
    }
  } catch {}
  return 1;
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState(loadScale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(fontScale));
    } catch {}
  }, [fontScale]);

  const setFontScale = useCallback((s: number) => {
    setFontScaleState(Math.min(1.4, Math.max(0.8, s)));
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize must be used within FontSizeProvider');
  return ctx;
}
