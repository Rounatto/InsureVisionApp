"use client";

import { useEffect, useState } from "react";

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

function StarRating({ rating }: { rating: number }) {
  const reviewCountStr = rating > 4.5 ? "200+" : rating > 4 ? "100+" : "50+";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? "text-red-500" : "text-zinc-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-zinc-400 text-xs ml-1">
        {rating.toFixed(1)} ({reviewCountStr})
      </span>
    </div>
  );
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="text-zinc-400 text-xs">
      {"€".repeat(level)}
      <span className="text-zinc-700">{"€".repeat(4 - level)}</span>
    </span>
  );
}

function MechanicCard({ mechanic, index }: { mechanic: Mechanic; index: number }) {
  const badges = [
    index === 0 && { label: "Recommandé", color: "bg-red-600" },
    mechanic.openNow && { label: "Ouvert", color: "bg-emerald-700" },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-3 hover:border-red-600/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.08)] group">
      {badges.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {badges.map((b) => (
            <span key={b.label} className={`${b.color} text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-red-400 transition-colors">
            {mechanic.name}
          </h3>
          {mechanic.specialty && (
            <p className="text-zinc-500 text-xs mt-0.5">{mechanic.specialty}</p>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-zinc-300 text-sm font-semibold">{mechanic.distance}</span>
          <PriceLevel level={mechanic.priceLevel} />
        </div>
      </div>

      <StarRating rating={mechanic.rating} />

      <div className="flex items-start gap-2 text-zinc-400 text-sm">
        <svg className="w-4 h-4 mt-0.5 shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{mechanic.address}</span>
      </div>

      {mechanic.phone && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <svg className="w-4 h-4 shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
          </svg>
          <a href={`tel:${mechanic.phone}`} className="hover:text-white transition-colors">{mechanic.phone}</a>
        </div>
      )}

      <button
        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(mechanic.name + " " + mechanic.address)}`, "_blank")}
        className="mt-1 w-full rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium py-2.5 hover:bg-white hover:text-black hover:border-white transition-all duration-200"
      >
        Voir sur Google Maps →
      </button>
    </div>
  );
}

export default function RepairRecommendations({ show, damageSummary }: RepairRecommendationsProps) {
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
      const { latitude, longitude } = await getUserLocation();

      try {
        const geoRes = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setLocationName(geoData.city || "votre zone");
        }
      } catch {
        setLocationName("votre zone");
      }

      const res = await fetch(`/api/mechanics?lat=${latitude}&lng=${longitude}${damageSummary ? `&damage=${encodeURIComponent(damageSummary)}` : ""}`);
      if (!res.ok) throw new Error("Impossible de récupérer les garagistes.");

      const data = await res.json();
      setMechanics(data.mechanics ?? []);
    } catch (err: any) {
      if (err.code === 1) {
        setError("Géolocalisation refusée. Activez la localisation pour voir les garagistes proches.");
      } else {
        setError(err.message ?? "Erreur lors de la récupération des garagistes.");
      }
    } finally {
      setLoading(false);
    }
  }

  function getUserLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Géolocalisation non supportée par ce navigateur."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        { timeout: 8000 }
      );
    });
  }

  if (!show) return null;

  return (
    <section className={`mt-10 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Services de réparation</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <h2 className="text-white text-2xl font-bold text-center">
          Recommandations de <span className="text-red-500">services de réparation</span>
        </h2>
        {locationName && (
          <p className="text-zinc-400 text-sm text-center mt-1">
            Garagistes proches de <span className="text-zinc-300">{locationName}</span>
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-0 rounded-full border-2 border-t-red-500 animate-spin" />
          </div>
          <p className="text-zinc-400 text-sm">Recherche des garagistes à proximité…</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-zinc-400 text-sm">{error}</p>
          <button onClick={fetchNearbyMechanics} className="mt-4 text-sm text-red-500 underline hover:text-red-400 transition-colors">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && mechanics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((m, i) => (
            <MechanicCard key={m.id} mechanic={m} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}