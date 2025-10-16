import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorValue, StatusBarStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme tokens: colors + spacing + sizes so components can consume consistent values
export type ThemeName = 'light' | 'dark';

export type ThemeColors = {
  background: ColorValue;
  surface: ColorValue;
  // compatibility: some code expects `card`
  card?: ColorValue;
  text: ColorValue;
  primary: ColorValue;
  primaryContrast: ColorValue;
  border: ColorValue;
  muted: ColorValue;
  success: ColorValue;
  danger: ColorValue;
};

export type ThemeSizes = {
  padding: number;
  radius: number;
  controlHeight: number;
  toggleWidth: number;
  toggleHeight: number;
  toggleThumb: number;
};

export type ThemeTokens = {
  name: ThemeName;
  colors: ThemeColors;
  sizes: ThemeSizes;
  statusBar: StatusBarStyle;
};

const light: ThemeTokens = {
  name: 'light',
  colors: {
    background: '#F7FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0F1724',
    primary: '#1D4ED8',
    primaryContrast: '#FFFFFF',
    border: '#E6E9EE',
    muted: '#6B7280',
    success: '#16A34A',
    danger: '#DC2626',
  },
  sizes: { padding: 16, radius: 12, controlHeight: 48, toggleWidth: 72, toggleHeight: 36, toggleThumb: 28 },
  statusBar: 'dark-content',
};

const dark: ThemeTokens = {
  name: 'dark',
  colors: {
    background: '#0B1220',
    surface: '#0F1724',
    card: '#0F1724',
    text: '#E6EEF6',
    primary: '#60A5FA',
    primaryContrast: '#0B1220',
    border: '#1F2937',
    muted: '#9CA3AF',
    success: '#34D399',
    danger: '#F87171',
  },
  sizes: { padding: 16, radius: 12, controlHeight: 48, toggleWidth: 72, toggleHeight: 36, toggleThumb: 28 },
  statusBar: 'light-content',
};

const STORAGE_KEY = 'app_theme';

type ThemeContextType = {
  theme: ThemeTokens;
  // Backwards-compatible shortcuts
  colors: ThemeColors;
  sizes: ThemeSizes;
  name: ThemeName;
  setThemeName: (t: ThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [name, setName] = useState<ThemeName>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') setName(saved as ThemeName);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setThemeName = async (t: ThemeName) => {
    setName(t);
    try { await AsyncStorage.setItem(STORAGE_KEY, t); } catch (_) { }
  };

  const toggleTheme = async () => {
    await setThemeName(name === 'light' ? 'dark' : 'light');
  };

  const theme = name === 'light' ? light : dark;

  return (
    <ThemeContext.Provider
      value={{ theme, colors: theme.colors, sizes: theme.sizes, name: theme.name, setThemeName, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
};

export default ThemeProvider;
