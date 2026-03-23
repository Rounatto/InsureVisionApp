// =====================================================
// HOME THEME SWITCHER
// =====================================================
// Composant spécifique à la page d'accueil pour gérer le thème dark/light
//
// FONCTIONNEMENT :
// ----------------
// 1. Ce composant applique la classe 'dark' à un conteneur spécifique (#home-container)
// 2. Il ne modifie PAS l'élément <html> (contrairement au comportement standard de Tailwind)
// 3. Le thème est sauvegardé dans localStorage pour persister entre les sessions
//
// DIFFÉRENCE AVEC UN THEME SWITCHER CLASSIQUE :
// ----------------------------------------------
// - Theme standard : Applique "dark" sur <html> → affecte TOUTE l'app
// - Notre approche : Applique "dark" sur #home-container → affecte SEULEMENT la page d'accueil
//
// POURQUOI CETTE APPROCHE ?
// --------------------------
// Les autres pages (login, register, dashboard) peuvent avoir leur propre système de thème
// indépendant de la page d'accueil.
//
// UTILISATION :
// -------------
// <HomeThemeSwitcher containerId="home-container" />
//
// containerId : ID du conteneur HTML sur lequel appliquer la classe "dark"
//
// =====================================================

'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

// Clé utilisée pour sauvegarder le thème dans localStorage du navigateur
const THEME_STORAGE_KEY = 'insurevision-home-theme';

export function HomeThemeSwitcher({ containerId }: { containerId: string }) {
  // État local pour suivre le mode actuel ("light" ou "dark")
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  // État pour gérer l'hydratation (évite les erreurs de rendu entre serveur et client)
  const [mounted, setMounted] = React.useState(false);

  /* =========================================================
   * FONCTION : applyMode
   * ---------------------------------------------------------
   * Applique le mode dark/light au conteneur spécifique
   *
   * ÉTAPES :
   * 1. Cherche l'élément HTML avec l'ID fourni (containerId)
   * 2. Si trouvé :
   *    - Mode "dark" → Ajoute la classe "dark"
   *    - Mode "light" → Supprime la classe "dark"
   * 3. Les styles CSS dans globals.css réagissent à cette classe
   *
   * EXEMPLE :
   * containerId = "home-container"
   * → Cible : <div id="home-container">
   * → Action : container.classList.add("dark")
   * → CSS réagit : #home-container.dark #home-nav { ... }
   * ========================================================= */
  const applyMode = React.useCallback(
    (nextMode: 'light' | 'dark') => {
      const container = document.getElementById(containerId);
      console.log('Applying theme:', nextMode, 'Container found:', !!container);

      // Sécurité : Vérifie que le conteneur existe
      if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
      }

      // Applique ou supprime la classe "dark"
      if (nextMode === 'dark') {
        container.classList.add('dark');
        console.log('Dark class added');
      } else {
        container.classList.remove('dark');
        console.log('Dark class removed');
      }
    },
    [containerId]
  );

  /* =========================================================
   * FONCTION : toggleMode
   * ---------------------------------------------------------
   * Bascule entre les modes light et dark
   *
   * ÉTAPES :
   * 1. Détermine le prochain mode (light ↔ dark)
   * 2. Applique le nouveau mode au DOM
   * 3. Sauvegarde le choix dans localStorage (persistance)
   * 4. Met à jour l'état React
   *
   * RÉSULTAT :
   * - L'utilisateur clique → Le thème change immédiatement
   * - Le choix est sauvegardé → Même thème au prochain chargement
   * ========================================================= */
  const toggleMode = () => {
    setMode((prevMode) => {
      // Inverse le mode actuel
      const nextMode = prevMode === 'dark' ? 'light' : 'dark';

      // Applique au DOM
      applyMode(nextMode);

      // Sauvegarde dans le navigateur
      localStorage.setItem(THEME_STORAGE_KEY, nextMode);

      return nextMode;
    });
  };

  /* =========================================================
   * EFFET : Initialisation au chargement
   * ---------------------------------------------------------
   * S'exécute UNE SEULE FOIS au montage du composant
   *
   * ÉTAPES :
   * 1. Marque le composant comme "monté" (mounted = true)
   * 2. Lit le thème sauvegardé dans localStorage
   * 3. Si un thème existe → l'utilise
   * 4. Sinon → utilise "light" par défaut
   * 5. Applique le mode au DOM
   *
   * RÉSULTAT :
   * - L'utilisateur revient sur le site → Son thème préféré est restauré
   * ========================================================= */
  React.useEffect(() => {
    setMounted(true);

    // Lit la préférence sauvegardée
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as
      | 'light'
      | 'dark'
      | null;
    let preferredMode: 'light' | 'dark' = 'light';

    if (storedMode !== null) {
      preferredMode = storedMode;
    }

    setMode(preferredMode);
    applyMode(preferredMode);
  }, [applyMode]);

  /* =========================================================
   * PROTECTION CONTRE L'HYDRATION MISMATCH
   * ---------------------------------------------------------
   * Problème :
   * - Serveur (SSR) : Rend le composant sans accès à localStorage
   * - Client : Rend avec la valeur de localStorage
   * - Résultat : HTML différent → Erreur d'hydratation React
   *
   * Solution :
   * - Ne rien rendre tant que le composant n'est pas "monté" côté client
   * - Une fois monté → on a accès à localStorage → rendu correct
   * ========================================================= */
  if (!mounted) {
    return null;
  }

  /* =========================================================
   * RENDU DU BOUTON
   * ---------------------------------------------------------
   * STRUCTURE :
   * - Bouton circulaire avec icône SVG
   * - Classe "theme-btn" : Ciblée par le CSS pour changer la couleur
   * - Au hover : Légère augmentation de taille (scale-105)
   *
   * ICÔNES DYNAMIQUES :
   * - Mode DARK → Affiche icône SOLEIL (☀️) : "Cliquez pour passer en light"
   * - Mode LIGHT → Affiche icône LUNE (🌙) : "Cliquez pour passer en dark"
   *
   * ACCESSIBILITÉ :
   * - aria-label : Description pour les lecteurs d'écran
   * - title : Tooltip au survol de la souris
   * - aria-hidden sur les SVG : Les icônes sont décoratives
   *
   * STYLES DYNAMIQUES (définis dans globals.css) :
   * - Light mode : Icône/bordure BLANCHE (visible sur nav noire)
   * - Dark mode : Icône/bordure NOIRE (visible sur nav blanche)
   * ========================================================= */
  return (
    <div className="flex items-center gap-2 p-2">
      <button
        onClick={toggleMode}
        className="theme-btn flex h-8 w-8 items-center justify-center rounded-full border hover:scale-105 transition-transform"
        aria-label="Toggle dark mode"
        title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Icône SOLEIL (affiché en mode dark) */}
        {mode === 'dark' ? (
          <Moon className="h-4 w-4" aria-hidden="true" />
        ) : (
          /* Icône LUNE (affiché en mode light) */
          <Sun className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
