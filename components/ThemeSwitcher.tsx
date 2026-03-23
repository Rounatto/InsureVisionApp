'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'insurevision-theme';

/**
 * Reads the current theme from the DOM class list.
 * The blocking <script> in layout.tsx ensures the class is set before React hydrates.
 */
function getActiveTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('theme-dark')
    ? 'dark'
    : 'light';
}

export default function ThemeSwitcher() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => getActiveTheme());
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const applyMode = useCallback((nextMode: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(nextMode === 'dark' ? 'theme-dark' : 'theme-light');
  }, []);

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    applyMode(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  // Render nothing until mounted to avoid icon mismatch
  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  return (
    <button
      onClick={toggleMode}
      className="flex h-8 w-8 items-center justify-center rounded-full text-inherit hover:scale-110 transition-transform cursor-pointer"
      aria-label="Toggle dark mode"
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
