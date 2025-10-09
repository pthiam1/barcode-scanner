import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorValue } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeName = 'light' | 'dark';

type ThemeColors = {
  background: ColorValue;
  card: ColorValue;
  text: ColorValue;
  primary: ColorValue;
  border: ColorValue;
  muted: ColorValue;
};

const lightColors: ThemeColors = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#111827',
  primary: '#2563EB',
  border: '#E6E9EE',
  muted: '#6B7280',
};

const darkColors: ThemeColors = {
  background: '#0B1220',
  card: '#0F1724',
  text: '#E6EEF6',
  primary: '#60A5FA',
  border: '#1F2937',
  muted: '#9CA3AF',
};

const STORAGE_KEY = 'app_theme';

type ThemeContextType = {
  theme: ThemeName;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (t: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') setThemeState(saved);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setTheme = async (t: ThemeName) => {
    setThemeState(t);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, t);
    } catch (e) {
      // ignore
    }
  };

  const toggleTheme = async () => {
    await setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
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
