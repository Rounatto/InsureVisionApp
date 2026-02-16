"use client"

import * as React from "react"

const themes = [
  { name: "Zinc", value: "240 5.9% 10%" },
  { name: "Red", value: "0 72.2% 50.6%" },
  { name: "Blue", value: "221.2 83.2% 53.3%" },
  { name: "Green", value: "142.1 76.2% 36.3%" },
  { name: "Orange", value: "24.6 95% 53.1%" },
  { name: "Violet", value: "262.1 83.3% 57.8%" },
]

export function ThemeSwitcher() {
  const changeTheme = (themeName: string, colorValue: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", colorValue);
    
    // Si c'est le thème Zinc (Noir), on active la sécurité contraste
    if (themeName === "Zinc") {
      root.style.setProperty("--left-text-color", "white");
    } else {
      root.style.setProperty("--left-text-color", `hsl(${colorValue})`);
    }
  }

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => changeTheme(theme.name, theme.value)}
          className="w-6 h-6 rounded-full border border-gray-300 hover:scale-125 transition-transform cursor-pointer"
          style={{ backgroundColor: `hsl(${theme.value})` }}
        />
      ))}
    </div>
  )
}