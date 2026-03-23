'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

// Clé unique pour mémoriser le thème dans localStorage.
const THEME_STORAGE_KEY = 'insurevision-theme';

// Composant qui gère le basculement Light/Dark sur tout le site.
export function ThemeSwitcher() {
  // Etat React : garde le mode courant en mémoire côté client.
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  // Applique une classe CSS sur <html> pour activer le thème global.
  const applyMode = React.useCallback((nextMode: 'light' | 'dark') => {
    // document.documentElement = l'élément <html>.
    const root = document.documentElement;

    // Supprime les deux classes pour éviter les conflits.
    root.classList.remove('theme-light', 'theme-dark');

    // Choisit la classe à appliquer selon le mode demandé.
    let themeClass;
    if (nextMode === 'dark') {
      themeClass = 'theme-dark';
    } else {
      themeClass = 'theme-light';
    }

    // Ajoute la classe finale sur <html>.
    root.classList.add(themeClass);
  }, []);

  // Action déclenchée au clic sur le bouton.
  const toggleMode = () => {
    // Calcule le prochain mode (si dark -> light, sinon -> dark).
    let nextMode: 'light' | 'dark';
    if (mode === 'dark') {
      nextMode = 'light';
    } else {
      nextMode = 'dark';
    }

    // Met a jour l'etat React (UI et icone).
    setMode(nextMode);

    // Applique la classe CSS sur <html>.
    applyMode(nextMode);

    // Persiste le choix pour les prochaines visites.
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  // Au chargement, determine le theme initial.
  React.useEffect(() => {
    // Lit le theme stocke (s'il existe).
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as
      | 'light'
      | 'dark'
      | null;

    // Mode prefere final (stocke OU prefere systeme).
    let preferredMode: 'light' | 'dark';
    if (storedMode !== null) {
      preferredMode = storedMode;
    } else {
      // matchMedia lit la preference OS (dark/light).
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        preferredMode = 'dark';
      } else {
        preferredMode = 'light';
      }
    }

    // Synchronise l'etat + applique la classe CSS.
    setMode(preferredMode);
    applyMode(preferredMode);
  }, [applyMode]);

  return (
    // Conteneur flex pour aligner l'icone.
    <div className="flex items-center gap-2 p-2">
      <button
        // On click : toggle entre light et dark.
        onClick={toggleMode}
        // Styles Tailwind : taille, border, couleur texte, animation hover.
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] hover:scale-105 transition-transform"
        // Accessibilite : label lu par lecteurs d'ecran.
        aria-label="Toggle dark mode"
        // Tooltip : texte d'aide au survol.
        title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Affiche l'icone soleil en dark mode, lune en light mode. */}
        {mode === 'dark' ? (
          <Moon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sun className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
