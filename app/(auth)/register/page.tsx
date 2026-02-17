"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import type { ErrorResponse, RegisterResponse } from "@/types/auth";

export default function Register() {
  const router = useRouter();

  // ─── Form State ───────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ─── UI State ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Helpers ──────────────────────────────────────────────
  const clearErrors = () => {
    setGeneralError("");
    setFieldErrors({});
  };

  // ─── Submit Handler ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data: RegisterResponse | ErrorResponse = await res.json();

      if (res.status === 201 && data.success) {
        // Registration succeeded → redirect to login
        router.push("/login");
        return;
      }

      // Handle validation errors (400)
      if (res.status === 400 && "errors" in data && data.errors) {
        const mapped: Record<string, string> = {};
        for (const err of data.errors) {
          mapped[err.field] = err.message;
        }
        setFieldErrors(mapped);
        return;
      }

      // Handle duplicate email (409) or any other error
      setGeneralError(data.message || "Something went wrong. Please try again.");
    } catch {
      setGeneralError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign-Up Handler ───────────────────────────────
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    clearErrors();
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setGeneralError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[url('/background2.jpg')] bg-cover bg-center p-4 overflow-hidden">
      
      {/* SÉLECTEUR DE COULEUR */}
      <ThemeSwitcher />

      {/* CARTE PRINCIPALE */}
      <div className="flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-white text-black font-sans">
        
        {/* SECTION GAUCHE (Texte dynamique avec sécurité contraste) */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[url('/background2.jpg')] bg-cover bg-center p-12 relative">
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          
          {/* HAUT : Branding (Dynamic text) */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-left-dynamic brightness-150 transition-colors duration-300">
              InsureVision AI
            </span>
            <div className="h-[1px] w-12 bg-left-dynamic/50 transition-colors duration-300"></div>
          </div>

          {/* BAS : Titre et Témoignage */}
          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-serif italic leading-tight mb-4 text-left-dynamic brightness-125 transition-colors duration-300">
              Accelerate<br />Your Claims<br />Processing
            </h1>
            
            {/* Carte de témoignage teintée par la couleur dynamique */}
            <div className="bg-left-dynamic/10 backdrop-blur-md border border-left-dynamic/20 p-4 rounded-2xl max-w-xs transition-colors duration-300">
                <p className="text-sm leading-relaxed mb-3 text-white/90 italic">
                    "InsureVision has saved our adjusters 40% of their time."
                </p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-400 border border-white/50" />
                    <div>
                        <p className="text-xs font-bold text-white">Sari Parantainen</p>
                        <p className="text-[10px] text-white/60">Claims Director</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* SECTION DROITE (Formulaire) */}
        <div className="flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 py-4 justify-between">
          <div className="flex-none flex justify-center pt-2">
            {/* Logo dynamique (SVG) */}
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto">
            <div className="text-center mb-5">
              {/* TITRE : Dynamique */}
              <h1 className="text-4xl font-serif text-primary italic mb-2 transition-colors duration-300">Create Account</h1>
              {/* SOUS-TITRE : Dynamique doux */}
              <p className="text-xs text-primary/60 transition-colors duration-300">Join our network of smart insurance adjusters</p>
            </div>

            <div className="flex flex-col gap-2.5 text-black">
              
              {/* General error message */}
              {generalError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600 text-center">
                  {generalError}
                </div>
              )}

              {/* Name (Label dynamique, Input fixe) */}
              <div>
                <label className="block mb-1.5 ml-1 text-xs font-medium text-primary/80 transition-colors duration-300">Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-full border border-gray-200 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-black placeholder-gray-400 transition-all duration-300 disabled:opacity-50"
                />
                {fieldErrors.name && <p className="mt-1 ml-3 text-[11px] text-red-500">{fieldErrors.name}</p>}
              </div>

              {/* Email (Label dynamique, Input fixe) */}
              <div>
                <label className="block mb-1.5 ml-1 text-xs font-medium text-primary/80 transition-colors duration-300">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-full border border-gray-200 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-black placeholder-gray-400 transition-all duration-300 disabled:opacity-50"
                />
                {fieldErrors.email && <p className="mt-1 ml-3 text-[11px] text-red-500">{fieldErrors.email}</p>}
              </div>

              {/* Passwords (Labels dynamiques, Inputs fixes) */}
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block mb-1.5 ml-1 text-xs font-medium text-primary/80 transition-colors duration-300">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-full border border-gray-100 bg-gray-50 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-black placeholder-gray-400 transition-all duration-300 disabled:opacity-50"
                  />
                  {fieldErrors.password && <p className="mt-1 ml-3 text-[11px] text-red-500">{fieldErrors.password}</p>}
                </div>
                <div className="w-1/2">
                  <label className="block mb-1.5 ml-1 text-xs font-medium text-primary/80 transition-colors duration-300">Confirm</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-full border border-gray-100 bg-gray-50 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-black placeholder-gray-400 transition-all duration-300 disabled:opacity-50"
                  />
                  {fieldErrors.confirmPassword && <p className="mt-1 ml-3 text-[11px] text-red-500">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {/* BOUTON CREATE : Dynamique */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-primary py-3.5 font-bold text-white text-sm transition-all duration-300 active:scale-95 hover:opacity-90 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Creating Account..." : "Create Account"}
                </button>
                {/* BOUTON GOOGLE : Fixe (Gris) */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || loading}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.3 7.3l6.3 5.2C39 37.2 44 31.2 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                    {googleLoading ? "Connecting..." : "Sign up with Google"}
                </button>
              </div>
            </div>
          </form>
          
          <div className="flex-none text-center pb-2">
            {/* PIED DE PAGE : Dynamique */}
            <p className="text-xs text-primary/60 transition-colors duration-300">Already have an account? 
                <Link href="/login" className="font-bold text-primary hover:underline transition-colors duration-300"> Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}