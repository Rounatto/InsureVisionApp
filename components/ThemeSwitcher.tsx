"use client"

import { useState, useCallback, useEffect } from "react"

const THEME_STORAGE_KEY = "insurevision-theme"

/**
 * Reads the current theme from the DOM class list.
 * The blocking <script> in layout.tsx ensures the class is set before React hydrates.
 */
function getActiveTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
}

export default function ThemeSwitcher() {
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  const applyMode = useCallback((nextMode: "light" | "dark") => {
    const root = document.documentElement
    root.classList.remove("theme-light", "theme-dark")

    if (nextMode === "dark") {
      root.classList.add("theme-dark")
      return
    }

    root.classList.add("theme-light")
  }, [])

  // Sync React state with what the blocking script already applied
  useEffect(() => {
    setMode(getActiveTheme())
    setMounted(true)
  }, [])

  const toggleMode = () => {
    let nextMode: "light" | "dark" = "dark"

    if (mode === "dark") {
      nextMode = "light"
    }

    setMode(nextMode)
    applyMode(nextMode)
    localStorage.setItem(THEME_STORAGE_KEY, nextMode)
  }

  // Render nothing until mounted to avoid icon mismatch
  if (!mounted) {
    return <div className="h-8 w-8" />
  }

  return (
    <button
      onClick={toggleMode}
      className="flex h-8 w-8 items-center justify-center rounded-full text-inherit hover:scale-110 transition-transform cursor-pointer"
      aria-label="Toggle dark mode"
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
        {mode === "dark" ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        )}
      </button>
  )
}