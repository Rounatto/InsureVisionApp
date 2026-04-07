'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import InsureVisionLogo from '@/components/InsureVisionLogo';
import LightRays from '@/components/LightRays';
import type { ErrorResponse, RegisterResponse } from '@/types/auth';
import { GoogleLogo } from '@/lib/icons';

export default function Register() {
  // `router` sert à naviguer programmatiquement après un événement (ex: succès)
  const router = useRouter();

  // ─── Form State ───────────────────────────────────────────
  // États contrôlés (controlled inputs) :
  // chaque input lit sa valeur depuis React + met à jour React au `onChange`.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Toggle visibilité pour le champ mot de passe principal
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── UI State ─────────────────────────────────────────────
  // États d'interface pour feedback utilisateur
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Helpers ──────────────────────────────────────────────
  // Réinitialise toutes les erreurs avant une nouvelle tentative
  const clearErrors = () => {
    setGeneralError('');
    setFieldErrors({});
  };

  // ─── Submit Handler ───────────────────────────────────────
  // Handler principal du formulaire d'inscription (email/password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data: RegisterResponse | ErrorResponse = await res.json();

      if (res.status === 201 && data.success) {
        // Registration succeeded → show verify-email screen like presentation flow
        const registeredEmail =
          'user' in data && data.user?.email ? data.user.email : email;
        router.push(
          `/verify-email?email=${encodeURIComponent(registeredEmail)}`
        );
        return;
      }

      // Handle validation errors (400)
      if (res.status === 400 && 'errors' in data && data.errors) {
        const mapped: Record<string, string> = {};
        // Transforme le tableau backend en objet indexé par champ
        for (const err of data.errors) {
          mapped[err.field] = err.message;
        }
        setFieldErrors(mapped);
        return;
      }

      // Handle duplicate email (409) or any other error
      setGeneralError(
        data.message || 'Something went wrong. Please try again.'
      );
    } catch {
      // Erreur réseau ou backend indisponible
      setGeneralError(
        'Unable to connect to the server. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign-Up Handler ───────────────────────────────
  // Déclenche l'authentification OAuth Google via NextAuth
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    clearErrors();
    try {
      // callbackUrl : page de redirection après login Google réussi
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setGeneralError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    // Conteneur plein écran, centré, avec image de fond
    <div className="relative flex h-screen w-full items-center justify-center bg-black p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.8}
          lightSpread={0.6}
          rayLength={1}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
          followMouse
          mouseInfluence={0.2}
          noiseAmount={0}
          distortion={0}
        />
      </div>

      {/* CARTE PRINCIPALE */}
      <div className="relative z-10 flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-[color:var(--card)] text-[color:var(--card-foreground)] font-sans">
        <div className="absolute inset-0 pointer-events-none">
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={0.8}
            lightSpread={0.6}
            rayLength={1}
            pulsating={false}
            fadeDistance={1}
            saturation={1}
            followMouse
            mouseInfluence={0.2}
            noiseAmount={0}
            distortion={0}
          />
        </div>

        {/* SECTION GAUCHE (Texte dynamique avec sécurité contraste) */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-transparent p-12 relative overflow-hidden">
          {/* HAUT : Branding (Dynamic text) */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase [.theme-light_&]:text-black [.theme-dark_&]:text-white">
              InsureVision AI
            </span>
            <div className="h-[1px] w-12 [.theme-light_&]:bg-black/50 [.theme-dark_&]:bg-white/50"></div>
          </div>

          {/* BAS : Titre et Témoignage */}
          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-serif italic leading-tight mb-4 [.theme-light_&]:text-black [.theme-dark_&]:text-white">
              Accelerate
              <br />
              Your Claims
              <br />
              Processing
            </h1>

            {/* Carte de témoignage teintée par la couleur dynamique */}
            <div className="backdrop-blur-md p-4 rounded-2xl max-w-xs [.theme-light_&]:bg-black/5 [.theme-light_&]:border [.theme-light_&]:border-black/10 [.theme-dark_&]:bg-white/10 [.theme-dark_&]:border [.theme-dark_&]:border-white/20">
              <p className="text-sm leading-relaxed mb-3 italic [.theme-light_&]:text-black/90 [.theme-dark_&]:text-white/90">
                &quot;InsureVision has saved our adjusters 40% of their
                time.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-400 border [.theme-light_&]:border-black/30 [.theme-dark_&]:border-white/50" />
                <div>
                  <p className="text-xs font-bold [.theme-light_&]:text-black [.theme-dark_&]:text-white">
                    Sari Parantainen
                  </p>
                  <p className="text-[10px] [.theme-light_&]:text-black/60 [.theme-dark_&]:text-white/60">
                    Claims Director
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION DROITE (Formulaire) */}
        <div className="relative flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 py-4 justify-between bg-[color:var(--card)]">
          {/* SÉLECTEUR DE COULEUR - Coin supérieur droit de la section */}
          <div className="absolute top-4 right-4 z-50 text-[color:var(--foreground)]">
            <ThemeSwitcher />
          </div>

          <div className="flex-none flex justify-center pt-2">
            {/* Logo dynamique (SVG) */}
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto"
          >
            {/*
              `onSubmit={handleSubmit}` connecte le bouton type="submit" à la logique ci-dessus.
              Même si l'utilisateur appuie sur Entrée dans un input, le submit est capturé.
            */}
            <div className="text-center mb-5">
              {/* TITRE : Dynamique */}
              <h1 className="text-4xl font-serif text-primary italic mb-2">
                Create Account
              </h1>
              {/* SOUS-TITRE : Dynamique doux */}
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Join our network of smart insurance adjusters
              </p>
            </div>

            <div className="flex flex-col gap-2.5 text-[color:var(--foreground)]">
              {/* General error message */}
              {generalError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600 text-center">
                  {generalError}
                </div>
              )}

              {/* Name (Label dynamique, Input fixe) */}
              <div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  // Valeur contrôlée depuis l'état React
                  value={name}
                  // Mise à jour à chaque frappe
                  onChange={(e) => setName(e.target.value)}
                  // Désactive pendant soumission pour éviter doubles envois
                  disabled={loading}
                  className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder-gray-400 disabled:opacity-50"
                />
                {/* Erreur ciblée du backend si le champ `name` est invalide */}
                {fieldErrors.name && (
                  <p className="mt-1 ml-3 text-[11px] text-red-500">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email (Label dynamique, Input fixe) */}
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder-gray-400 disabled:opacity-50"
                />
                {/* Erreur ciblée pour l'email (format, doublon selon backend, etc.) */}
                {fieldErrors.email && (
                  <p className="mt-1 ml-3 text-[11px] text-red-500">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Passwords (Labels dynamiques, Inputs fixes) */}
              <div className="flex gap-3">
                <div className="w-1/2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder-gray-400 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Erreur de robustesse mot de passe (taille, complexité, etc.) */}
                  {fieldErrors.password && (
                    <p className="mt-1 ml-3 text-[11px] text-red-500">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
                <div className="w-1/2">
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-full border border-[color:var(--border)] bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder-gray-400 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Erreur de mismatch avec le champ password */}
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 ml-3 text-[11px] text-red-500">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {/* BOUTON CREATE : Dynamique */}
                <button
                  type="submit"
                  // Bloqué pendant l'envoi pour éviter race conditions / multi-click
                  disabled={loading}
                  className="w-full rounded-full [.theme-light_&]:bg-black [.theme-light_&]:text-white [.theme-dark_&]:bg-white [.theme-dark_&]:text-black py-3.5 font-bold text-sm active:scale-95 hover:opacity-90 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                {/* BOUTON GOOGLE : Fixe (Gris) */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  // Bloque si OAuth en cours OU submit classique en cours
                  disabled={googleLoading || loading}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3.5 font-semibold text-gray-900 hover:bg-gray-50 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleLogo className="h-5 w-5" />
                  {googleLoading ? 'Connecting...' : 'Sign up with Google'}
                </button>
              </div>
            </div>
          </form>

          <div className="flex-none text-center pb-2">
            {/* PIED DE PAGE : Dynamique */}
            {/* Navigation alternative pour utilisateurs déjà inscrits */}
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Already have an account?
              <Link
                href="/login"
                className="font-bold text-[color:var(--foreground)] hover:underline"
              >
                {' '}
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
