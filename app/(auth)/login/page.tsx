"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import InsureVisionLogo from "@/components/InsureVisionLogo";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[url('/background2.jpg')] bg-cover bg-center p-4 overflow-hidden">
      

      {/* CARTE PRINCIPALE */}
      <div className="flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-[color:var(--card)] font-sans">
        
        {/* SECTION GAUCHE */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[url('/background2.jpg')] bg-cover bg-center p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-white brightness-150">
              InsureVision AI
            </span>
            <div className="h-[1px] w-12 bg-white/50"></div>
          </div>

          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-serif italic leading-tight mb-4 text-white brightness-125">
              Smart<br />Damage<br />Estimation
            </h1>
            <p className="text-sm text-white/80 font-light leading-relaxed max-w-xs">
              Upload detailed car photos and let our AI generate accurate repair costs in seconds.
            </p>
            
            <div className="mt-6 flex items-center gap-3 opacity-90">
                <div className="flex -space-x-2">
                    <div className="h-6 w-6 rounded-full border border-white bg-gray-500"></div>
                    <div className="h-6 w-6 rounded-full border border-white bg-gray-400"></div>
                    <div className="h-6 w-6 rounded-full border border-white bg-gray-300"></div>
                </div>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-white/70">
                  Trusted by Top Insurers
                </span>
            </div>
          </div>
        </div>

        {/* SECTION DROITE */}
        <div className="relative flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 py-6 justify-between bg-[color:var(--card)]">
          
          {/* SÉLECTEUR DE COULEUR - Coin supérieur droit de la section */}
          <div className="absolute top-4 right-4 z-50">
            <ThemeSwitcher />
          </div>

          <div className="flex-none flex justify-center pt-4">
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif text-primary italic mb-2">
                Welcome Back
              </h1>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Enter your email and password to access your account
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block mb-2 ml-1 text-xs font-medium text-[color:var(--foreground)]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-[color:var(--border)] bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder:text-gray-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 ml-1 text-xs font-medium text-[color:var(--foreground)]">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-full border border-[color:var(--border)] bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder:text-gray-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-gray-300 accent-primary" /> Remember me
                </label>
                <Link href="/forgot-password" title="Forgot Password" className="text-xs font-semibold text-[color:var(--foreground)] hover:underline">
                  Forgot Password
                </Link>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-3 mt-2">
                <button className="w-full rounded-full bg-gray-900 dark:bg-white py-4 font-bold text-white dark:text-black text-sm active:scale-95 hover:opacity-90 cursor-pointer shadow-lg">
                  Sign In
                </button>

                <button className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white dark:bg-gray-800 py-4 font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-sm cursor-pointer">
                  <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.3 7.3l6.3 5.2C39 37.2 44 31.2 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                  Sign In with Google
                </button>
              </div>
            </div>
          </div>

          <div className="flex-none text-center pb-2 pt-4">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-[color:var(--foreground)] hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}