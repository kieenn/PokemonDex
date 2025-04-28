// context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useColorScheme as useNativeColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define your color palettes
const LightColors = {
  text: '#000', background: '#fff', tint: '#2f95dc', tabIconDefault: '#ccc',
  card: '#f8f8f8', border: '#eee', primary: '#0a7ea4', error: '#ff3b30',
};
const DarkColors = {
  text: '#fff', background: '#121212', tint: '#fff', tabIconDefault: '#ccc',
  card: '#1e1e1e', border: '#333', primary: '#17a2b8', error: '#ff453a',
};
type Theme = 'light' | 'dark';
interface ThemeContextProps { theme: Theme; colors: typeof LightColors; toggleTheme: () => void; setTheme: (theme: Theme) => void; }

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
interface ThemeProviderProps { children: ReactNode; }

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useNativeColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemColorScheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme') as Theme | null;
        setThemeState(savedTheme || systemColorScheme || 'light');
      } catch (e) { console.error("Failed to load theme", e); setThemeState(systemColorScheme || 'light'); }
    };
    loadTheme();
  }, [systemColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem('appTheme').then(savedTheme => {
        if (!savedTheme) { setThemeState(colorScheme || 'light'); }
      });
    });
    return () => subscription.remove();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    try { await AsyncStorage.setItem('appTheme', newTheme); setThemeState(newTheme); }
    catch (e) { console.error("Failed to save theme", e); }
  };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const colors = useMemo(() => (theme === 'light' ? LightColors : DarkColors), [theme]);
  const value = useMemo(() => ({ theme, colors, toggleTheme, setTheme }), [theme, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) { throw new Error('useTheme must be used within a ThemeProvider'); }
  return context;
};
