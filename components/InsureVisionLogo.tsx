// =====================================================
// components/InsureVisionLogo.tsx
// =====================================================
// Composant qui affiche le logo InsureVision (icône œil/vision)
// 
// FONCTIONNEMENT :
// - Utilise SVG pour un logo vectoriel (toujours net, quelle que soit la taille)
// - fill-current : permet au logo de prendre la couleur du texte (color)
// - className : accepte des classes CSS personnalisées pour changer la couleur
// 
// UTILISATION DANS LA NAVIGATION :
// - En light mode : className="nav-logo" → texte blanc via CSS
// - En dark mode : className="nav-logo" → texte noir via CSS
// - Le CSS dans globals.css gère automatiquement le changement de couleur
// =====================================================

import React from 'react';

export default function InsureVisionLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={`fill-current ${className || ''}`}
    >
      <path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" />
      <path d="M50 40c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z" />
      <path d="M10 50c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5zM100 50c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5z" />
    </svg>
  );
}