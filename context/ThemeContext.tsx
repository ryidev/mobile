import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  // Backgrounds
  bg: '#f8fafc',         // slate-50
  bgCard: '#ffffff',
  bgMuted: '#f1f5f9',    // slate-100
  // Borders
  border: '#e2e8f0',     // slate-200
  // Text
  text: '#0f172a',       // slate-900
  textMuted: '#64748b',  // slate-500
  textInverse: '#ffffff',
  // Accent
  accent: '#4f46e5',     // indigo-600
  accentLight: '#eef2ff', // indigo-50
  accentDark: '#3730a3',
  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

const darkColors = {
  // Backgrounds
  bg: '#09090b',         // zinc-950
  bgCard: '#18181b',     // zinc-900
  bgMuted: '#27272a',    // zinc-800
  // Borders
  border: '#3f3f46',     // zinc-700
  // Text
  text: '#f4f4f5',       // zinc-100
  textMuted: '#71717a',  // zinc-500
  textInverse: '#09090b',
  // Accent
  accent: '#6366f1',     // indigo-500 (brighter in dark)
  accentLight: '#1e1b4b', // indigo-950
  accentDark: '#4f46e5',
  // Status
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  const toggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'system') return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
