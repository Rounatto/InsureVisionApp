"use client"

import * as React from "react"

// Les couleurs disponibles (Format HSL pour Tailwind)
const themes = [
  { name: "Zinc", value: "240 5.9% 10%" },   // Noir (Défaut)
  { name: "Red", value: "0 72.2% 50.6%" },    // Rouge
  { name: "Blue", value: "221.2 83.2% 53.3%" }, // Bleu
  { name: "Green", value: "142.1 76.2% 36.3%" }, // Vert
  { name: "Orange", value: "24.6 95% 53.1%" }, // Orange
  { name: "Violet", value: "262.1 83.3% 57.8%" }, // Violet
]

export function ThemeSwitcher() {
  const changeTheme = (colorValue: string) => {
    // C'est ici que ça modifie la variable --primary de ton CSS global
    document.documentElement.style.setProperty("--primary", colorValue)
  }

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => changeTheme(theme.value)}
          className="w-6 h-6 rounded-full border border-gray-300 hover:scale-125 transition-transform cursor-pointer shadow-sm"
          style={{ backgroundColor: `hsl(${theme.value})` }}
          title={`Switch to ${theme.name}`}
        />
      ))}
    </div>
  )
}