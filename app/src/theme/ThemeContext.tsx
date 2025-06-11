import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, Theme } from './theme';
import { ColorScheme } from './colors';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forcedColorScheme?: ColorScheme; // Allow forcing a specific theme
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, forcedColorScheme } = props;
  // Use system color scheme by default, but allow override
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme = forcedColorScheme || 
    (systemColorScheme === 'dark' ? 'dark' : 'light');
  
  const theme = createTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
