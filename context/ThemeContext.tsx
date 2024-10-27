// ThemeContext.tsx
// Mariann Grace Dizon

import React, { createContext, useState, ReactNode } from 'react';

export const ThemeContext = createContext({
  theme: 'light', // default value
  toggleTheme: () => {},
  currentTheme: {}, // Add currentTheme to provide theme colors
});

// If you have a provider component, ensure it's exported as well
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const lightTheme = {
  text: '#11181C',
  background: '#fff',
  tint: '#0a7ea4',
  icon: '#687076',
  tabIconDefault: '#687076',
  tabIconSelected: '#0a7ea4',
};

export const darkTheme = {
  text: '#ECEDEE',
  background: '#151718',
  tint: '#fff',
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#fff',
};
