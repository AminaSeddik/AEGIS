import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;
  accent: string;
  accentBg: string;
  cyber: string;
  cyberBg: string;
  chartColors: string[];
  hoverBg: string;
  activeBg: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const darkColors: ThemeColors = {
  bgPrimary: '#0a0f1c',
  bgSecondary: '#0d1424',
  bgTertiary: '#1a1f2e',
  bgCard: 'linear-gradient(135deg, #0d1424 0%, #1a1f2e 100%)',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#1e293b',
  borderLight: '#334155',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.2)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.2)',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.2)',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.2)',
  accent: '#8b5cf6',
  accentBg: 'rgba(139, 92, 246, 0.2)',
  cyber: '#06b6d4',
  cyberBg: 'rgba(6, 182, 212, 0.2)',
  chartColors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
  hoverBg: 'rgba(255, 255, 255, 0.05)',
  activeBg: 'rgba(59, 130, 246, 0.2)',
};

const lightColors: ThemeColors = {
  bgPrimary: '#f8fafc',
  bgSecondary: '#ffffff',
  bgTertiary: '#f1f5f9',
  bgCard: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
  warning: '#d97706',
  warningBg: 'rgba(217, 119, 6, 0.15)',
  danger: '#dc2626',
  dangerBg: 'rgba(220, 38, 38, 0.15)',
  info: '#2563eb',
  infoBg: 'rgba(37, 99, 235, 0.15)',
  accent: '#7c3aed',
  accentBg: 'rgba(124, 58, 237, 0.15)',
  cyber: '#0891b2',
  cyberBg: 'rgba(8, 145, 178, 0.15)',
  chartColors: ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'],
  hoverBg: 'rgba(0, 0, 0, 0.05)',
  activeBg: 'rgba(37, 99, 235, 0.15)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('aegis-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aegis-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { darkColors, lightColors };
