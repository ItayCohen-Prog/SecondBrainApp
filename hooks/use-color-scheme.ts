import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';
type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colorScheme: 'light' | 'dark';
  isLoading: boolean;
};

const THEME_STORAGE_KEY = 'themeMode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>(systemScheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
          return;
        }
        if (stored === 'system') {
          setModeState(systemScheme);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [systemScheme]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => {
      // Non-fatal: fallback to in-memory only
    });
  }, []);

  const colorScheme = mode ?? systemScheme;

  const value = useMemo(
    () => ({
      mode,
      setMode,
      colorScheme,
      isLoading,
    }),
    [mode, setMode, colorScheme, isLoading]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'light' as ThemeMode,
      setMode: () => {},
      isLoading: false,
    };
  }
  return { mode: ctx.mode, setMode: ctx.setMode, isLoading: ctx.isLoading };
}

export function useColorScheme() {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.colorScheme;
  return useSystemColorScheme() ?? 'light';
}
