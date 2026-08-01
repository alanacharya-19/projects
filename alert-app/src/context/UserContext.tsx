import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';

interface UserContextValue {
  userName: string | null;
  isLoaded: boolean;
  setUserName: (name: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.USER_NAME).then((stored) => {
      if (stored) setUserNameState(stored);
      setIsLoaded(true);
    });
  }, []);

  const setUserName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setUserNameState(trimmed);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, trimmed);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ userName, isLoaded, setUserName }),
    [userName, isLoaded, setUserName]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
