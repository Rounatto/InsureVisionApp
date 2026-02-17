"use client"

import * as React from "react"

const THEME_STORAGE_KEY = "insurevision-theme"

export function ThemeSwitcher() {
  const [mode, setMode] = React.useState<"light" | "dark">("light")

  const applyMode = React.useCallback((nextMode: "light" | "dark") => {
    const root = document.documentElement
    root.classList.remove("theme-light", "theme-dark")
    root.classList.add(nextMode === "dark" ? "theme-dark" : "theme-light")
  }, [])

  const toggleMode = () => {
    const nextMode = mode === "dark" ? "light" : "dark"
    setMode(nextMode)
    applyMode(nextMode)
    localStorage.setItem(THEME_STORAGE_KEY, nextMode)
  }

  React.useEffect(() => {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null
    const preferredMode = storedMode ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    setMode(preferredMode)
    applyMode(preferredMode)
  }, [applyMode])

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 p-2 bg-[color:var(--card)]/90 backdrop-blur-md rounded-full shadow-lg border border-[color:var(--border)]">
      <button
        onClick={toggleMode}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] hover:scale-105 transition-transform"
        aria-label="Toggle dark mode"
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {mode === "dark" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 4.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 12 4.75zM5.47 6.53a.75.75 0 0 1 1.06 0l.36.36a.75.75 0 1 1-1.06 1.06l-.36-.36a.75.75 0 0 1 0-1.06zM4.75 12a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 4.75 12zM6.89 17.11a.75.75 0 0 1 0 1.06l-.36.36a.75.75 0 1 1-1.06-1.06l.36-.36a.75.75 0 0 1 1.06 0zM12 18.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75zM18.53 17.47a.75.75 0 0 1 1.06 0l.36.36a.75.75 0 1 1-1.06 1.06l-.36-.36a.75.75 0 0 1 0-1.06zM18.75 12a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75zM18.53 6.53a.75.75 0 0 1 0 1.06l-.36.36a.75.75 0 1 1-1.06-1.06l.36-.36a.75.75 0 0 1 1.06 0zM12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M21 14.5A7.5 7.5 0 1 1 9.5 3a.75.75 0 0 1 .7 1.03A6 6 0 0 0 17.97 11.8a.75.75 0 0 1 1.03.7z" />
          </svg>
        )}
      </button>
    </div>
  )
}