"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
interface Mechanic {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  distance: string;
  phone?: string;
  openNow?: boolean;
  specialty?: string;
  priceLevel?: number;
}

interface RepairRecommendationsProps {
  show: boolean;
  damageSummary?: string;
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const reviewCountStr = rating > 4.5 ? "200+" : rating > 4 ? "100+" : "50+";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? "text-[color:var(--foreground)]"
              : "text-[color:var(--border)]"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[color:var(--muted-foreground)] text-xs ml-1 font-medium">
        {rating.toFixed(1)} ({reviewCountStr})
      </span>
    </div>
  );
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="text-[color:var(--foreground)] text-xs font-medium">
      {"€".repeat(level)}
      <span className="text-[color:var(--muted-foreground)] opacity-50">
        {"€".repeat(4 - level)}
      </span>
    </span>
  );
}

function MechanicCard({ mechanic, index }: { mechanic: Mechanic; index: number }) {
  const badges = [
    index === 0 && {
      label: "Recommandé",
      color: "bg-[color:var(--foreground)] text-[color:var(--background)]",
    },
    mechanic.openNow && {
      label: "Ouvert",
      color: "bg-green-500/10 text-green-600 border border-green-500/20",
    },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <div className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 flex flex-col gap-3 hover:border-[color:var(--foreground)]/40 transition-all duration-300 hover:shadow-md group">
      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`${b.color} text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[color:var(--foreground)] font-bold text-base leading-tight">
            {mechanic.name}
          </h3>
          {mechanic.specialty && (
            <p className="text-[color:var(--muted-foreground)] text-xs mt-0.5">
              {mechanic.specialty}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[color:var(--foreground)] text-sm font-semibold">
            {mechanic.distance}
          </span>
          <PriceLevel level={mechanic.priceLevel} />
        </div>
      </div>

      {/* Rating */}
      <StarRating rating={mechanic.rating} />

      {/* Address */}
      <div className="flex items-start gap-2 text-[color:var(--muted-foreground)] text-sm mt-1">
        <svg
          className="w-4 h-4 mt-0.5 shrink-0 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>{mechanic.address}</span>
      </div>

      {/* Phone */}
      {mechanic.phone && (
        <div className="flex items-center gap-2 text-[color:var(--muted-foreground)] text-sm">
          <svg
            className="w-4 h-4 shrink-0 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
            />
          </svg>
          <a
            href={`tel:${mechanic.phone}`}
            className="hover:text-[color:var(--foreground)] transition-colors font-medium"
          >
            {mechanic.phone}
          </a>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() =>
          window.open(
            `https://maps.google.com/?q=${encodeURIComponent(
              mechanic.name + " " + mechanic.address
            )}`,
            "_blank"
          )
        }
        className="mt-2 w-full rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] text-sm font-medium py-2.5 hover:bg-[color:var(--muted)] transition-all duration-200"
      >
        Voir sur la carte
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function RepairRecommendations({
  show,
  damageSummary,
}: RepairRecommendationsProps) {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, [show]);

  useEffect(() => {
    if (!visible) return;
    fetchNearbyMechanics();
  }, [visible]);

  async function fetchNearbyMechanics() {
    setLoading(true);
    setError(null);

    try {
      // Obtenir la position avec Fallback silencieux si refusée
      const { latitude, longitude } = await getUserLocation();

      try {
        const geoRes = await fetch(
          `/api/geocode?lat=${latitude}&lng=${longitude}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setLocationName(geoData.city || "votre zone");
        }
      } catch {
        setLocationName("votre zone");
      }

      const res = await fetch(
        `/api/mechanics?lat=${latitude}&lng=${longitude}${
          damageSummary ? `&damage=${encodeURIComponent(damageSummary)}` : ""
        }`
      );

      if (!res.ok) throw new Error("Impossible de récupérer les garagistes.");

      const data = await res.json();
      setMechanics(data.mechanics ?? []);
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la récupération des garagistes.");
    } finally {
      setLoading(false);
    }
  }

  // Modifié pour ne plus déclencher d'erreur visible si la loc est refusée
  function getUserLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve) => {
      const defaultLocation = {
        latitude: 35.8256, // Sousse par défaut
        longitude: 10.63699,
      } as GeolocationCoordinates;

      if (!navigator.geolocation) {
        resolve(defaultLocation);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        () => resolve(defaultLocation), // Si refusé, on utilise la position par défaut
        { timeout: 5000 }
      );
    });
  }

  if (!show) return null;

  return (
    <section
      className={`mt-10 transition-all duration-700 ease-out border-t border-[color:var(--border)] pt-10 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 justify-center">
          <div className="h-px w-8 bg-[color:var(--border)]" />
          <span className="text-[color:var(--muted-foreground)] text-[10px] uppercase tracking-widest font-bold">
            Services de réparation
          </span>
          <div className="h-px w-8 bg-[color:var(--border)]" />
        </div>
        <h2 className="text-[color:var(--foreground)] text-3xl font-black text-center tracking-tight">
          Recommandations
        </h2>
        {locationName && (
          <p className="text-[color:var(--muted-foreground)] text-sm text-center mt-2 font-medium">
            Ateliers proches de <span className="text-[color:var(--foreground)]">{locationName}</span>
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-[color:var(--border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[color:var(--foreground)] animate-spin" />
          </div>
          <p className="text-[color:var(--muted-foreground)] text-sm font-medium">
            Recherche à proximité…
          </p>
        </div>
      )}

      {/* Error State (Rarement visible maintenant grâce au fallback) */}
      {error && !loading && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center max-w-md mx-auto">
          <p className="text-[color:var(--foreground)] text-sm font-medium mb-4">
            {error}
          </p>
          <button
            onClick={fetchNearbyMechanics}
            className="rounded-full border border-[color:var(--border)] px-6 py-2 text-xs font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Mechanics Grid */}
      {!loading && !error && mechanics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((m, i) => (
            <MechanicCard key={m.id} mechanic={m} index={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && mechanics.length === 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center">
          <p className="text-[color:var(--muted-foreground)] text-sm font-medium">
            Aucun garagiste trouvé à proximité.
          </p>
        </div>
      )}
    </section>
  );
}