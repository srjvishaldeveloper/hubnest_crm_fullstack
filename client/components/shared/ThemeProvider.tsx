'use client';

import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      {children}
    </NextThemeProvider>
  );
}

export function useTheme() {
  const { theme, setTheme } = useNextTheme();
  return {
    theme: (theme as 'light' | 'dark' | 'system') || 'dark',
    setTheme: (t: 'light' | 'dark' | 'system') => setTheme(t),
  };
}
