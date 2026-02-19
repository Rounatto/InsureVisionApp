import type { Config } from 'tailwindcss';

const config: Config = {
  // Utilise le mode 'class' pour que les styles dark: se basent sur la classe 'dark'
  darkMode: 'class',
  // Spécifie les fichiers à scanner pour les classes Tailwind
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;
