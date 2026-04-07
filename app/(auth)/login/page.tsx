'use client';

// =====================================================
// PAGE DE CONNEXION (LOGIN)
// =====================================================
// Cette page est un composant CLIENT car elle utilise :
// - des hooks React (`useState`) pour l'état local
// - des interactions utilisateur (clic sur bouton, saisie, etc.)
//
// OBJECTIF MÉTIER :
// Permettre à un utilisateur existant de se connecter via :
// 1) Email + mot de passe
// 2) Google OAuth (bouton social)

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import InsureVisionLogo from '@/components/InsureVisionLogo';
import LightRays from '@/components/LightRays';
import { GoogleLogo } from '@/lib/icons';

const REMEMBER_ME_PREF_COOKIE = 'iv_remember_me';

export default function Login() {
  const router = useRouter();

  // -------------------------------------------------------------------
  // ÉTAT LOCAL
  // -------------------------------------------------------------------
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const persistRememberPreference = (value: boolean) => {
    document.cookie = `${REMEMBER_ME_PREF_COOKIE}=${value ? '1' : '0'}; Max-Age=900; Path=/; SameSite=Lax`;
  };

  // -------------------------------------------------------------------
  // HANDLER: Connexion avec email/mot de passe
  // -------------------------------------------------------------------
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      persistRememberPreference(rememberMe);
      const result = await signIn('credentials', {
        email,
        password,
        remember: rememberMe ? 'true' : 'false',
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || 'Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred during sign in');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // HANDLER: Connexion avec Google
  // -------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      persistRememberPreference(rememberMe);
      await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
    } catch (err) {
      setError('An error occurred during Google sign in');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    // ==================================================================
    // CONTENEUR GLOBAL PLEIN ÉCRAN
    // ==================================================================
    // - `h-screen` : prend toute la hauteur du viewport
    // - `bg-[url('/background2.jpg')]` : image de fond principale
    // - `overflow-hidden` : évite les barres de scroll causées par effets visuels
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
      {/*
        Carte centrale qui contient :
        - Section gauche (branding / storytelling)
        - Section droite (formulaire de connexion)

        Responsiveness :
        - max-w-5xl : limite la largeur sur grand écran
        - h-[85vh] + min-h-[600px] : équilibre entre densité visuelle et lisibilité
        - rounded-[40px] + shadow-2xl : style "glass card" premium
      */}
      <div className="relative z-10 flex w-full max-w-5xl h-[85vh] min-h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-[color:var(--card)] font-sans">
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

        {/* SECTION GAUCHE */}
        {/*
          SECTION DÉCORATIVE / BRANDING
          - cachée sur mobile (`hidden md:flex`) pour prioriser le formulaire
          - visible dès `md` pour enrichir l'identité visuelle
        */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-transparent p-12 relative overflow-hidden">
          {/* Badge marque en haut */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase [.theme-light_&]:text-black [.theme-dark_&]:text-white">
              InsureVision AI
            </span>
            <div className="h-[1px] w-12 [.theme-light_&]:bg-black/50 [.theme-dark_&]:bg-white/50"></div>
          </div>

          {/* Message marketing principal */}
          <div className="relative z-10 mb-4">
            <h1 className="text-5xl font-serif italic leading-tight mb-4 [.theme-light_&]:text-black [.theme-dark_&]:text-white">
              Smart
              <br />
              Damage
              <br />
              Estimation
            </h1>
            <p className="text-sm font-light leading-relaxed max-w-xs [.theme-light_&]:text-black/80 [.theme-dark_&]:text-white/80">
              Upload detailed car photos and let our AI generate accurate repair
              costs in seconds.
            </p>

            {/* Mini preuve sociale (avatars stylisés + claim) */}
            <div className="mt-6 flex items-center gap-3 opacity-90">
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full border [.theme-light_&]:border-black/30 [.theme-dark_&]:border-white bg-gray-500"></div>
                <div className="h-6 w-6 rounded-full border [.theme-light_&]:border-black/30 [.theme-dark_&]:border-white bg-gray-400"></div>
                <div className="h-6 w-6 rounded-full border [.theme-light_&]:border-black/30 [.theme-dark_&]:border-white bg-gray-300"></div>
              </div>
              <span className="text-[10px] font-semibold tracking-wide uppercase [.theme-light_&]:text-black/70 [.theme-dark_&]:text-white/70">
                Trusted by Top Insurers
              </span>
            </div>
          </div>
        </div>

        {/* SECTION DROITE */}
        {/*
          SECTION FONCTIONNELLE : formulaire + actions de connexion.
          C'est la partie qui doit rester lisible et prioritaire à tout écran.
        */}
        <div className="relative flex w-full md:w-1/2 flex-col h-full px-8 md:px-12 py-6 justify-between bg-[color:var(--card)]">
          {/* SÉLECTEUR DE COULEUR - Coin supérieur droit de la section */}
          {/*
            ThemeSwitcher pilote le thème global défini par tes variables CSS
            (`--card`, `--foreground`, etc.).
          */}
          <div className="absolute top-4 right-4 z-50 text-[color:var(--foreground)]">
            <ThemeSwitcher />
          </div>

          {/* Logo centré pour ancrer la marque avant le formulaire */}
          <div className="flex-none flex justify-center pt-4">
            <InsureVisionLogo className="h-auto w-16" />
          </div>

          {/* Bloc formulaire (formulaire fonctionnel pour sign in) */}
          <form
            className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto"
            onSubmit={handleCredentialsSignIn}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif text-primary italic mb-2">
                Welcome Back
              </h1>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Enter your email and password to access your account
              </p>
            </div>

            {/* Affichage des erreurs */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block mb-2 ml-1 text-xs font-medium text-[color:var(--foreground)]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full rounded-full border border-[color:var(--border)] bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder:text-gray-400 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 ml-1 text-xs font-medium text-[color:var(--foreground)]">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full rounded-full border border-[color:var(--border)] bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-600 placeholder:text-gray-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/*
                Ligne utilitaire :
                - "Remember me" pour mémoriser une session (UI)
                - lien récupération mot de passe
              */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-gray-300 accent-primary disabled:opacity-50"
                  />{' '}
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  title="Forgot Password"
                  className="text-xs font-semibold text-[color:var(--foreground)] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-3 mt-2">
                {/*
                  Bouton principal login
                */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full [.theme-light_&]:bg-black [.theme-light_&]:text-white [.theme-dark_&]:bg-white [.theme-dark_&]:text-black py-4 font-bold text-sm active:scale-95 hover:opacity-90 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                {/*
                  Bouton social Google
                */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-4 font-semibold text-gray-900 hover:bg-gray-50 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleLogo className="h-5 w-5" />
                  Sign In with Google
                </button>
              </div>
            </div>
          </form>

          {/*
            Pied de carte : navigation secondaire vers inscription.
            Pattern classique "pas encore de compte ?".
          */}
          <div className="flex-none text-center pb-2 pt-4">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Don&apos;t have an account ?{' '}
              <Link
                href="/register"
                className="font-bold text-[color:var(--foreground)] hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
