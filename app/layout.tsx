// =====================================================
// ROOT LAYOUT (layout global Next.js App Router)
// =====================================================
// Ce fichier enveloppe TOUTES les pages sous /app.
// Dans App Router, un layout est persistant entre navigations :
// - il évite de remonter/recréer toute la structure à chaque changement de page
// - il centralise les imports globaux (CSS, fonts, wrappers)

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

// Police sans-serif principale (UI générale)
const geistSans = Geist({
  // Expose une variable CSS réutilisable dans `className`
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsureVision AI",
  description: "Smart car damage estimation powered by AI",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

// Layout racine : structure HTML de base pour toute l'application
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var t = localStorage.getItem('insurevision-theme');
    if (!t) t = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add('theme-' + t);
  } catch(e) {}
})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
